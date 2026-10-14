import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

serve(async (_req: Request) => {
  try {
    console.log("[CRON DAY 31 SCHEDULER STARTED]", new Date().toISOString());

    // 1. Fetch active students with overdue billing cycles
    const today = new Date().toISOString().split("T")[0];

    const { data: overdueCycles, error: cycleErr } = await supabaseAdmin
      .from("billing_cycles")
      .select(`
        id,
        student_id,
        cycle_start_date,
        cycle_due_date,
        fee_amount,
        amount_paid,
        is_fully_paid,
        reminder_sent,
        students (
          id,
          name,
          student_code,
          phone,
          status
        )
      `)
      .eq("is_fully_paid", false)
      .eq("reminder_sent", false)
      .lte("cycle_due_date", today); // On or past due date

    if (cycleErr) throw cycleErr;

    let queuedCount = 0;

    for (const cycle of overdueCycles || []) {
      const student = (cycle as any).students;
      if (!student || student.status !== "active") continue;

      const outstanding = Number(cycle.fee_amount) - Number(cycle.amount_paid);
      if (outstanding <= 0) continue;

      // 2. Check Day 31: at least 1 day has passed since cycle_due_date
      const dueDate = new Date(cycle.cycle_due_date);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 1) {
        // Not yet Day 31 (due date was today or in future)
        continue;
      }

      const overdueDayCount = 30 + diffDays;
      const reminderId = `rem_${student.id}_${cycle.cycle_due_date}_day31`;

      // 3. Idempotency Check: verify reminder has not already been created
      const { data: existing } = await supabaseAdmin
        .from("reminder_logs")
        .select("id")
        .eq("id", reminderId)
        .maybeSingle();

      if (existing) {
        continue; // Prevent duplicates
      }

      // 4. Create reminder log
      const messageText = `Dear ${student.name} (${student.student_code}), your monthly fee of ₹${outstanding.toLocaleString()} was due on ${cycle.cycle_due_date} (Day ${overdueDayCount} overdue). Kindly make payment today to avoid interruption in classes. Thank you.`;

      await supabaseAdmin.from("reminder_logs").insert({
        id: reminderId,
        student_id: student.id,
        billing_cycle_id: cycle.id,
        due_date: cycle.cycle_due_date,
        overdue_day_count: overdueDayCount,
        pending_amount: outstanding,
        message_text: messageText,
        status: "pending",
        scheduled_for: new Date().toISOString(),
        is_mock: true,
      });

      // Mark cycle as reminder_sent = true to prevent re-scheduling
      await supabaseAdmin
        .from("billing_cycles")
        .update({ reminder_sent: true, is_overdue: true })
        .eq("id", cycle.id);

      queuedCount++;
    }

    console.log(`[CRON DAY 31 FINISHED] Queued ${queuedCount} reminders`);

    return new Response(
      JSON.stringify({
        status: "success",
        queued: queuedCount,
        timestamp: new Date().toISOString(),
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: any) {
    console.error("[CRON ERROR]", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
