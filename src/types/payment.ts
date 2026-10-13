export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'other';

export interface Payment {
  id: string;
  studentId: string;
  studentName?: string;
  studentCode?: string;
  amount: number;
  paymentDate: string;        // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  notes?: string;
  recordedBy?: string;        // Admin ID
  billingCycleId?: string;
  createdAt: string;
}

export interface BillingCycle {
  id: string;
  studentId: string;
  cycleStartDate: string;     // YYYY-MM-DD
  cycleDueDate: string;       // YYYY-MM-DD (+30 days)
  feeAmount: number;
  amountPaid: number;
  isFullyPaid: boolean;
  isOverdue: boolean;
  reminderSent: boolean;
  createdAt: string;
}

export interface RecordPaymentInput {
  studentId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  notes?: string;
}

export interface FeeSummary {
  totalActiveStudents: number;
  totalCollected: number;
  totalOutstanding: number;
  dueSoonCount: number;
  overdueCount: number;
  upcomingRemindersCount: number;
}
