import { ReminderLog } from '../types/reminder';
import { Student } from '../types/student';
import { formatDisplayDate, getDaysRemaining } from './date';

export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Generates an idempotent deduplication key for a reminder.
 * Prevents multiple messages being scheduled/sent for the same billing cycle.
 */
export function generateReminderIdempotencyKey(studentId: string, dueDate: string): string {
  return `rem_${studentId}_${dueDate}_day31`;
}

/**
 * Determines if an active student is eligible for an overdue WhatsApp reminder:
 * - Student must be 'active' (not archived).
 * - Student must have an outstanding balance > 0.
 * - Days remaining must be <= -1 (i.e., on or after Day 31 of the billing cycle).
 */
export function isEligibleForDay31Reminder(student: Student): boolean {
  if (student.status !== 'active') return false;
  if (student.outstandingAmount <= 0) return false;
  const daysLeft = getDaysRemaining(student.nextDeadline);
  // -1 or lower indicates at least 1 full day has elapsed past the 30-day deadline (Day 31+)
  return daysLeft <= -1;
}

/**
 * Replaces placeholders in a WhatsApp reminder template body.
 */
export function compileReminderMessage(
  templateBody: string,
  student: Student
): string {
  return templateBody
    .replace(/\{\{student_name\}\}/g, student.name)
    .replace(/\{\{student_code\}\}/g, student.studentCode)
    .replace(/\{\{amount\}\}/g, student.outstandingAmount.toLocaleString())
    .replace(/\{\{due_date\}\}/g, formatDisplayDate(student.nextDeadline));
}

/**
 * Generates a mock Meta WhatsApp message provider ID.
 */
export function generateMockProviderMessageId(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let random = '';
  for (let i = 0; i < 24; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `wamid.HBgL${random}`;
}

/**
 * Calculates overdue day count from target due date.
 */
export function getOverdueDayCount(dueDate: string): number {
  const daysPast = Math.abs(Math.min(0, getDaysRemaining(dueDate)));
  // Day 30 is the deadline, so 1 day past deadline = Day 31
  return 30 + daysPast;
}
