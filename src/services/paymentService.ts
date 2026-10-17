import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Payment, RecordPaymentInput } from '../types/payment';
import { Student } from '../types/student';
import { evaluatePaymentPolicy } from '../utils/billingCycle';

const STORAGE_KEYS = {
  PAYMENTS: '@fee_manager_payments_v1',
};

export const PaymentService = {
  /**
   * Fetches all recorded payments ordered by payment date descending
   */
  async fetchPayments(): Promise<Payment[]> {
    if (!isSupabaseConfigured) {
      return await this.getLocalPayments();
    }

    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          student_id,
          amount,
          payment_date,
          payment_method,
          transaction_ref,
          notes,
          created_at,
          students (
            name,
            student_code
          )
        `)
        .order('payment_date', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        return await this.getLocalPayments();
      }

      return data.map((row: any) => ({
        id: row.id,
        studentId: row.student_id,
        studentName: row.students?.name || 'Unknown Student',
        studentCode: row.students?.student_code || '',
        amount: Number(row.amount),
        paymentDate: row.payment_date,
        paymentMethod: row.payment_method,
        transactionRef: row.transaction_ref || undefined,
        notes: row.notes || undefined,
        createdAt: row.created_at,
      }));
    } catch (err) {
      console.warn('Failed to fetch payments from Supabase, using local fallback:', err);
      return await this.getLocalPayments();
    }
  },

  /**
   * Records a payment, applies partial/full payment policy, and updates billing cycle
   */
  async recordPayment(
    input: RecordPaymentInput,
    student: Student
  ): Promise<{
    payment: Payment;
    newDeadline: string;
    remainingBalance: number;
    isFullPayment: boolean;
  }> {
    const policyResult = evaluatePaymentPolicy(
      student.monthlyFee,
      student.outstandingAmount,
      input.amount,
      input.paymentDate,
      student.nextDeadline
    );

    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newPaymentRecord: Payment = {
      id: paymentId,
      studentId: input.studentId,
      studentName: student.name,
      studentCode: student.studentCode,
      amount: input.amount,
      paymentDate: input.paymentDate,
      paymentMethod: input.paymentMethod,
      transactionRef: input.transactionRef?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        // 1. Insert into payments table
        const { error: payErr } = await supabase.from('payments').insert({
          student_id: input.studentId,
          amount: input.amount,
          payment_date: input.paymentDate,
          payment_method: input.paymentMethod,
          transaction_ref: input.transactionRef?.trim() || null,
          notes: input.notes?.trim() || null,
        });

        if (payErr) throw payErr;

        // 2. If full payment, advance billing cycle
        if (policyResult.isFullPayment) {
          await supabase.from('billing_cycles').insert({
            student_id: input.studentId,
            cycle_start_date: input.paymentDate,
            cycle_due_date: policyResult.newNextDeadline,
            fee_amount: student.monthlyFee,
            amount_paid: 0,
            is_fully_paid: false,
            is_overdue: false,
          });
        }
      } catch (e) {
        console.warn('Failed to write payment to Supabase, saving locally:', e);
      }
    }

    // Always cache locally for instant UI responsiveness and offline support
    const local = await this.getLocalPayments();
    const updated = [newPaymentRecord, ...local];
    await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(updated));

    return {
      payment: newPaymentRecord,
      newDeadline: policyResult.newNextDeadline,
      remainingBalance: policyResult.remainingCycleBalance,
      isFullPayment: policyResult.isFullPayment,
    };
  },

  async getLocalPayments(): Promise<Payment[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS);
      if (!data) return [];
      const parsed: Payment[] = JSON.parse(data);
      // Clean out any legacy seed entries
      const sanitized = parsed.filter((p) => !p.id.includes('seed') && !p.id.includes('test'));
      if (sanitized.length !== parsed.length) {
        await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(sanitized));
      }
      return sanitized;
    } catch {
      return [];
    }
  },
};
