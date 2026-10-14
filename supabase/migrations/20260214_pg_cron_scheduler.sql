-- ==============================================================================
-- Fee Manager: Server-Side Autonomous Day 31 Overdue Scheduler (pg_cron)
-- ==============================================================================

-- 1. Enable required extensions for scheduled HTTP triggers
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Schedule daily execution at 09:00 AM UTC
-- The cron expression '0 9 * * *' executes every day at 09:00 UTC
-- Replace <PROJECT_REF> and <ANON_KEY> with your Supabase project parameters
SELECT cron.schedule(
    'fee-manager-daily-day31-reminder',
    '0 9 * * *',
    $$
    SELECT net.http_post(
        url := 'https://' || current_setting('app.settings.project_ref', true) || '.functions.supabase.co/cron-day31-scheduler',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.anon_key', true)
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);

-- 3. Stored Procedure for Manual / On-Demand Day 31 Verification
CREATE OR REPLACE FUNCTION public.scan_day31_overdue_accounts()
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    student_code TEXT,
    overdue_days INTEGER,
    pending_fee NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id AS student_id,
        s.name AS student_name,
        s.student_code AS student_code,
        (CURRENT_DATE - bc.cycle_due_date + 30)::INTEGER AS overdue_days,
        (bc.fee_amount - bc.amount_paid) AS pending_fee
    FROM public.billing_cycles bc
    JOIN public.students s ON s.id = bc.student_id
    WHERE s.status = 'active'
      AND bc.is_fully_paid = FALSE
      AND (CURRENT_DATE - bc.cycle_due_date) >= 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
