export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface ReminderLog {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  studentPhone: string;
  billingCycleId: string;
  dueDate: string;              // YYYY-MM-DD
  overdueDayCount: number;      // e.g., 31 for Day 31
  pendingAmount: number;
  messageText: string;
  status: ReminderStatus;
  scheduledFor: string;         // ISO date
  sentAt?: string;              // ISO date
  providerMessageId?: string;   // WhatsApp API message ID
  errorMessage?: string;
  attemptCount: number;
  isMock: boolean;              // distinguish mock from real API
  createdAt: string;
}

export interface ReminderTemplate {
  id: string;
  name: string;
  templateCode: string;         // WhatsApp approved template name
  language: string;             // e.g. en_US
  body: string;                 // Body with placeholders: {{student_name}}, {{amount}}, {{due_date}}
  isActive: boolean;
}
