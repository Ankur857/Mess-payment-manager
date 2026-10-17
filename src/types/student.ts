export type StudentStatus = 'active' | 'inactive';

export type StudentFeeStatus = 'paid' | 'due' | 'overdue' | 'partial';

export interface Student {
  id: string;
  studentCode: string;          // e.g., STU-2026-0001 (immutable, unique)
  name: string;
  phone: string;
  parentName?: string;
  parentPhone?: string;
  monthlyFee: number;
  status: StudentStatus;
  photoUrl?: string;
  admissionDate: string;        // YYYY-MM-DD
  notes?: string;

  // Calculated billing status
  feeStatus: StudentFeeStatus;
  lastPaymentDate?: string;     // YYYY-MM-DD
  nextDeadline: string;         // YYYY-MM-DD (last payment date + 30 days)
  daysRemaining: number;        // negative if overdue
  outstandingAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentInput {
  name: string;
  phone: string;
  parentName?: string;
  parentPhone?: string;
  monthlyFee: number;
  photoUrl?: string;
  admissionDate?: string;
  notes?: string;
}

export interface UpdateStudentInput extends Partial<CreateStudentInput> {
  status?: StudentStatus;
  lastPaymentDate?: string;
  nextDeadline?: string;
  outstandingAmount?: number;
  feeStatus?: StudentFeeStatus;
  daysRemaining?: number;
}
