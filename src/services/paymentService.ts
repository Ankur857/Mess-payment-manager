import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Payment, RecordPaymentInput } from '../types/payment';
import { Student } from '../types/student';
import { evaluatePaymentPolicy } from '../utils/billingCycle';

const STORAGE_KEYS = {
  PAYMENTS: '@fee_manager_payments_v1',
};

// Seed initial payments for first launch
const INITIAL_SEED_PAYMENTS: Payment[] = [
  {
    id: 'pay-seed-1',
    studentId: 'stu-3',
    studentName: 'Vihaan Verma',
    studentCode: 'STU-2026-0003',
    amount: 3500,
    paymentDate: '2026-02-13',
    paymentMethod: 'upi',
    transactionRef: 'UPI/6044192834',
    notes: 'February regular fee paid in full',
    createdAt: '2026-02-13T14:30:00Z',
  },
  {
    id: 'pay-seed-2',
    studentId: 'stu-4',
    studentName: 'Ananya Iyer',
    studentCode: 'STU-2026-0004',
    amount: 4500,
    paymentDate: '2026-02-12',
    paymentMethod: 'cash',
    notes: 'Received by Cash Desk',
    createdAt: '2026-02-12T11:15:00Z',
  },
  {
    id: 'pay-seed-3',
    studentId: 'stu-1',
    studentName: 'Aarav Sharma',
    studentCode: 'STU-2026-0001',
    amount: 3500,
    paymentDate: '2026-01-10',
    paymentMethod: 'bank_transfer',
    transactionRef: 'IMPS/99812401',
    notes: 'January installment',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'pay-seed-4',
    studentId: 'stu-2',
    studentName: 'Diya Patel',
    studentCode: 'STU-2026-0002',
    amount: 2000,
    paymentDate: '2026-01-12',
    paymentMethod: 'upi',
    transactionRef: 'UPI/7712498213',
    notes: 'Partial payment of 4000 fee',
    createdAt: '2026-01-12T10:00:00Z',
  },
];

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
      if (!data) {
        await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_SEED_PAYMENTS));
        return INITIAL_SEED_PAYMENTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_SEED_PAYMENTS;
    }
  },
};
