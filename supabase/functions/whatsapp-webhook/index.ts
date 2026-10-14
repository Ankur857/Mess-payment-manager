import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_VERIFY_TOKEN = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN") || "feemanager_webhook_verify_token_2026";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  const url = new URL(req.url);

  // 1. Meta Webhook Verification (GET request)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
      console.log("[WEBHOOK VERIFIED] Meta challenge matched");
      return new Response(challenge, { status: 200 });
    } else {
      return new Response("Forbidden", { status: 403 });
    }
  }

  // 2. Meta Event Notification (POST request)
  if (req.method === "POST") {
    try {
      const body = await req.json();

      // Process message status updates
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const statuses = change.value?.statuses || [];
          for (const statusObj of statuses) {
            const providerMessageId = statusObj.id; // e.g., wamid.HBgL...
            const status = statusObj.status; // 'sent' | 'delivered' | 'read' | 'failed'
            const timestamp = statusObj.timestamp
              ? new Date(parseInt(statusObj.timestamp, 10) * 1000).toISOString()
              : new Date().toISOString();

            console.log(`[STATUS UPDATE] ID: ${providerMessageId} -> Status: ${status}`);

            if (providerMessageId && supabaseUrl && supabaseServiceKey) {
              const mappedStatus = status === 'failed' ? 'failed' : 'sent';
              await supabaseAdmin
                .from("reminder_logs")
                .update({
                  status: mappedStatus,
                  sent_at: timestamp,
                })
                .eq("provider_message_id", providerMessageId);
            }
          }
        }
      }

      return new Response(JSON.stringify({ status: "success" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } catch (e: any) {
      console.error("[WEBHOOK ERROR]", e);
      return new Response(JSON.stringify({ error: e.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
});
