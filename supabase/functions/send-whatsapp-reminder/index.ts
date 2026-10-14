import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestPayload {
  reminderId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  phone: string;
  amount: number;
  dueDate: string;
  messageText: string;
  forceMock?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: RequestPayload = await req.json();
    const { reminderId, studentName, studentCode, phone, amount, dueDate, messageText, forceMock } = payload;

    // Backend environment secrets
    const whatsappToken = Deno.env.get("WHATSAPP_API_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const isLiveConfigured = Boolean(whatsappToken && phoneNumberId && !forceMock);

    let providerMessageId = "";
    let deliveryStatus = "sent";
    let errorMessage: string | null = null;
    let isMock = true;

    if (!isLiveConfigured) {
      // -------------------------------------------------------------
      // MOCK MODE: Simulated WhatsApp Dispatch
      // -------------------------------------------------------------
      console.log(`[MOCK WHATSAPP DISPATCH] To: ${phone} | Student: ${studentName} (${studentCode}) | Amount: ₹${amount}`);
      providerMessageId = `wamid.HBgL${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
      isMock = true;
    } else {
      // -------------------------------------------------------------
      // LIVE MODE: Official Meta WhatsApp Business Platform Cloud API
      // -------------------------------------------------------------
      isMock = false;
      const cleanPhone = phone.replace(/[^0-9]/g, "");

      const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
      const body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "template",
        template: {
          name: "fee_reminder_overdue_v1",
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: studentName },
                { type: "text", text: studentCode },
                { type: "text", text: String(amount) },
                { type: "text", text: dueDate },
              ],
            },
          ],
        },
      };

      const metaResponse = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const metaData = await metaResponse.json();

      if (!metaResponse.ok || metaData.error) {
        deliveryStatus = "failed";
        errorMessage = metaData.error?.message || "Failed to dispatch via WhatsApp Cloud API";
        console.error("[LIVE WHATSAPP ERROR]", metaData);
      } else {
        providerMessageId = metaData.messages?.[0]?.id || "";
        console.log(`[LIVE WHATSAPP SUCCESS] ID: ${providerMessageId}`);
      }
    }

    // Update reminder_logs in Supabase using service-role client
    if (reminderId && supabaseUrl && supabaseServiceKey) {
      await supabaseAdmin
        .from("reminder_logs")
        .update({
          status: deliveryStatus,
          sent_at: deliveryStatus === "sent" ? new Date().toISOString() : null,
          provider_message_id: providerMessageId || null,
          error_message: errorMessage,
          is_mock: isMock,
        })
        .eq("id", reminderId);
    }

    return new Response(
      JSON.stringify({
        success: deliveryStatus === "sent",
        providerMessageId,
        isMock,
        status: deliveryStatus,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
