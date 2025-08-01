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
    const { phoneNumber, message, notificationId } = await req.json();

    console.log('Sending SMS:', { phoneNumber, message, notificationId });

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // SMS API integration would go here
    // For now, we'll simulate the SMS sending
    const smsSuccess = true; // Replace with actual SMS API call

    if (smsSuccess) {
      // Update notification status
      if (notificationId) {
        await supabaseAdmin
          .from('notifications')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', notificationId);
      }

      console.log('SMS sent successfully');
      return new Response(
        JSON.stringify({ success: true, message: 'SMS sent successfully' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } else {
      // Update notification status to failed
      if (notificationId) {
        await supabaseAdmin
          .from('notifications')
          .update({ 
            status: 'failed'
          })
          .eq('id', notificationId);
      }

      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send SMS' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
  } catch (error) {
    console.error('Error in send-sms function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});