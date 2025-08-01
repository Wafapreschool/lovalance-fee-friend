import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Checking for overdue fees...');

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Find overdue fees
    const { data: overdueFees, error: fetchError } = await supabaseAdmin
      .from('student_fees')
      .select(`
        id,
        amount,
        reminder_sent,
        students!inner (
          id,
          full_name,
          parent_phone
        ),
        school_months!inner (
          month_name,
          due_date
        )
      `)
      .eq('status', 'pending')
      .lt('school_months.due_date', new Date().toISOString().split('T')[0]);

    if (fetchError) {
      console.error('Error fetching overdue fees:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${overdueFees?.length || 0} overdue fees`);

    // Mark fees as overdue
    if (overdueFees && overdueFees.length > 0) {
      const overdueIds = overdueFees.map(fee => fee.id);
      await supabaseAdmin
        .from('student_fees')
        .update({ is_overdue: true })
        .in('id', overdueIds);
    }

    // Send reminders for fees that haven't had reminders sent yet
    const feesNeedingReminders = overdueFees?.filter(fee => !fee.reminder_sent) || [];
    
    const notifications = [];
    for (const fee of feesNeedingReminders) {
      const message = `Reminder: Your child's school fee for ${fee.school_months.month_name} is overdue. Please make the payment of MVR ${fee.amount} as soon as possible to avoid any inconvenience.`;

      // Create notification record
      const { data: notification, error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          student_id: fee.students.id,
          notification_type: 'payment_reminder',
          message: message,
          phone_number: fee.students.parent_phone,
          status: 'pending'
        })
        .select()
        .single();

      if (notificationError) {
        console.error('Error creating reminder notification:', notificationError);
        continue;
      }

      notifications.push({
        notificationId: notification.id,
        phoneNumber: fee.students.parent_phone,
        message: message,
        studentFeeId: fee.id
      });
    }

    // Send SMS reminders
    const smsPromises = notifications.map(async (notif) => {
      try {
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: notif.phoneNumber,
            message: notif.message,
            notificationId: notif.notificationId
          })
        });

        const result = await response.json();
        
        if (result.success) {
          // Mark reminder as sent
          await supabaseAdmin
            .from('student_fees')
            .update({ reminder_sent: true })
            .eq('id', notif.studentFeeId);
        }

        console.log('Reminder SMS sent for student fee:', notif.studentFeeId, result);
        return result;
      } catch (error) {
        console.error('Error sending reminder SMS:', error);
        return { success: false, error: error.message };
      }
    });

    const smsResults = await Promise.all(smsPromises);
    const successfulReminders = smsResults.filter(result => result.success).length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${overdueFees?.length || 0} overdue fees, sent ${successfulReminders} reminder notifications`,
        overdueFees: overdueFees?.length || 0,
        remindersSent: successfulReminders
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in check-overdue-fees function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});