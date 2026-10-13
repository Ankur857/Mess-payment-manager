-- ==============================================================================
-- Fee Manager: Normalized PostgreSQL Schema Migration with Row Level Security
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Updated At trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. ADMIN PROFILES (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT 'Super Admin',
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_admin_profiles_updated_at
    BEFORE UPDATE ON public.admin_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_code TEXT NOT NULL UNIQUE, -- STU-YYYY-XXXX (immutable, database-enforced)
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    phone TEXT NOT NULL CHECK (char_length(trim(phone)) >= 10),
    parent_name TEXT,
    parent_phone TEXT,
    monthly_fee NUMERIC(10, 2) NOT NULL CHECK (monthly_fee >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    photo_url TEXT,
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_student_code ON public.students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_students_phone ON public.students(phone);

CREATE TRIGGER set_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. BILLING CYCLES TABLE
CREATE TABLE IF NOT EXISTS public.billing_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    cycle_start_date DATE NOT NULL,
    cycle_due_date DATE NOT NULL, -- cycle_start_date + 30 days
    fee_amount NUMERIC(10, 2) NOT NULL CHECK (fee_amount >= 0),
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    is_fully_paid BOOLEAN NOT NULL DEFAULT FALSE,
    is_overdue BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_cycles_student_id ON public.billing_cycles(student_id);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_due_date ON public.billing_cycles(cycle_due_date);
CREATE INDEX IF NOT EXISTS idx_billing_cycles_is_overdue ON public.billing_cycles(is_overdue);

CREATE TRIGGER set_billing_cycles_updated_at
    BEFORE UPDATE ON public.billing_cycles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. PAYMENTS TABLE (Immutable Ledger)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    billing_cycle_id UUID REFERENCES public.billing_cycles(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'other')),
    transaction_ref TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES public.admin_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);

-- 7. REMINDER LOGS TABLE
CREATE TABLE IF NOT EXISTS public.reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    billing_cycle_id UUID REFERENCES public.billing_cycles(id) ON DELETE SET NULL,
    due_date DATE NOT NULL,
    overdue_day_count INTEGER NOT NULL DEFAULT 31,
    pending_amount NUMERIC(10, 2) NOT NULL CHECK (pending_amount >= 0),
    message_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    provider_message_id TEXT,
    error_message TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    is_mock BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_student_id ON public.reminder_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_status ON public.reminder_logs(status);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_scheduled_for ON public.reminder_logs(scheduled_for);

-- 8. REMINDER TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.reminder_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    template_code TEXT NOT NULL UNIQUE,
    language TEXT NOT NULL DEFAULT 'en_US',
    body TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Templates
INSERT INTO public.reminder_templates (name, template_code, body)
VALUES
    ('Day 31 Overdue Notice', 'fee_reminder_overdue_v1', 'Dear {{student_name}} ({{student_code}}), your monthly fee of ₹{{amount}} was due on {{due_date}}. Kindly make payment today to avoid interruption in classes. Thank you.'),
    ('Payment Received Confirmation', 'payment_received_receipt_v1', 'Dear {{student_name}}, we have received your payment of ₹{{amount}} via {{method}} on {{date}}. Next billing deadline is {{next_due}}. Thank you!')
ON CONFLICT (template_code) DO NOTHING;

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_templates ENABLE ROW LEVEL SECURITY;

-- Helper function: is current user an authenticated admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.role() = 'authenticated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for Authenticated Admin
CREATE POLICY "Admins have full access to admin_profiles"
    ON public.admin_profiles FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to students"
    ON public.students FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to billing_cycles"
    ON public.billing_cycles FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to payments"
    ON public.payments FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to reminder_logs"
    ON public.reminder_logs FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins have full access to reminder_templates"
    ON public.reminder_templates FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10. SUPABASE STORAGE BUCKET FOR STUDENT PHOTOS
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated admins can upload student photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'student-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view student photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'student-photos');
