import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertRequest {
  parentEmail: string;
  childName: string;
  alertType: 'approaching_limit' | 'time_request';
  remainingMinutes?: number;
  requestedMinutes?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { parentEmail, childName, alertType, remainingMinutes, requestedMinutes }: AlertRequest = await req.json();

    let subject = '';
    let html = '';

    if (alertType === 'approaching_limit') {
      subject = `⏰ Screen Time Alert: ${childName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Screen Time Alert</h1>
          <p style="font-size: 16px; color: #555;">
            Hi! This is a friendly reminder that <strong>${childName}</strong> has only 
            <strong>${remainingMinutes} minutes</strong> of screen time remaining today.
          </p>
          <p style="font-size: 14px; color: #777; margin-top: 20px;">
            You can adjust screen time limits in the Parental Controls section of the app.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">
            This is an automated alert from JubeeLove
          </p>
        </div>
      `;
    } else if (alertType === 'time_request') {
      subject = `🙏 Screen Time Request from ${childName}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Screen Time Request</h1>
          <p style="font-size: 16px; color: #555;">
            <strong>${childName}</strong> is requesting <strong>${requestedMinutes} more minutes</strong> 
            of screen time.
          </p>
          <p style="font-size: 14px; color: #777; margin-top: 20px;">
            Open the app to approve or deny this request in the Parental Controls section.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">
            This is an automated notification from JubeeLove
          </p>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "JubeeLove <onboarding@resend.dev>",
      to: [parentEmail],
      subject,
      html,
    });

    console.log("Screen time alert sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending screen time alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
