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
    const payload = await req.json();
    console.log('BML Payment webhook received:', payload);

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Extract payment information from BML webhook payload
    const { 
      payment_id, 
      status, 
      amount, 
      reference,
      student_fee_id 
    } = payload;

    if (status === 'completed' && student_fee_id) {
      // Update student fee status
      const { error: updateError } = await supabaseAdmin
        .from('student_fees')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString(),
          bml_payment_id: payment_id
        })
        .eq('id', student_fee_id);

      if (updateError) {
        console.error('Error updating student fee:', updateError);
        throw updateError;
      }

      // Get student information for notification
      const { data: studentFee, error: fetchError } = await supabaseAdmin
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
            month_name
          )
        `)
        .eq('id', student_fee_id)
        .single();

      if (fetchError) {
        console.error('Error fetching student fee:', fetchError);
        throw fetchError;
      }

      // Create payment confirmation notification
      const confirmationMessage = `Payment Confirmed: Your payment of MVR ${studentFee.amount} for ${studentFee.school_months.month_name} has been successfully processed. Thank you!`;

      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          student_id: studentFee.students.id,
          notification_type: 'payment_confirmed',
          message: confirmationMessage,
          phone_number: studentFee.students.parent_phone,
          status: 'pending'
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      // Send confirmation SMS
      try {
        const smsResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: studentFee.students.parent_phone,
            message: confirmationMessage
          })
        });

        console.log('Confirmation SMS sent:', await smsResponse.json());
      } catch (smsError) {
        console.error('Error sending confirmation SMS:', smsError);
      }

      console.log('Payment processed successfully');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error processing BML webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});