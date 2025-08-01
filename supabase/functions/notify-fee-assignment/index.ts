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
    const { studentFeeIds } = await req.json();

    console.log('Processing fee assignment notifications for:', studentFeeIds);

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Fetch student fee details
    const { data: studentFees, error: fetchError } = await supabaseAdmin
      .from('student_fees')
      .select(`
        id,
        amount,
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
      .in('id', studentFeeIds);

    if (fetchError) {
      console.error('Error fetching student fees:', fetchError);
      throw fetchError;
    }

    // Process each student fee
    const notifications = [];
    for (const fee of studentFees || []) {
      const dueDate = new Date(fee.school_months.due_date).toLocaleDateString();
      const message = `New Fee Assignment: Your child ${fee.students.full_name} has been assigned a fee of MVR ${fee.amount} for ${fee.school_months.month_name}. Due date: ${dueDate}. Please make payment before the due date.`;

      // Create notification record
      const { data: notification, error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          student_id: fee.students.id,
          notification_type: 'fee_assigned',
          message: message,
          phone_number: fee.students.parent_phone,
          status: 'pending'
        })
        .select()
        .single();

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        continue;
      }

      notifications.push({
        notificationId: notification.id,
        phoneNumber: fee.students.parent_phone,
        message: message
      });

      // Mark fee as notification sent
      await supabaseAdmin
        .from('student_fees')
        .update({ notification_sent: true })
        .eq('id', fee.id);
    }

    // Send SMS notifications
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
        console.log('SMS sent for notification:', notif.notificationId, result);
        return result;
      } catch (error) {
        console.error('Error sending SMS for notification:', notif.notificationId, error);
        return { success: false, error: error.message };
      }
    });

    const smsResults = await Promise.all(smsPromises);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${notifications.length} fee assignment notifications`,
        smsResults 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in notify-fee-assignment function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});