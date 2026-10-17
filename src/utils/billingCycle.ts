import { BillingCycle } from '../types/payment';
import { StudentFeeStatus } from '../types/student';
import { addCalendarDays, getDaysRemaining } from './date';

export const BILLING_CYCLE_DAYS = 30;

/**
 * Calculates the next deadline given a qualifying payment date (+30 calendar days).
 */
export function calculateNextDeadline(paymentDate: string): string {
  return addCalendarDays(paymentDate, BILLING_CYCLE_DAYS);
}

/**
 * Evaluates whether an account is on or past Day 31 of its billing cycle.
 * Day 0 = cycle start date.
 * Day 30 = due date.
 * Day 31 = overdue reminder trigger day (1 day after due date).
 */
export function isDay31Overdue(dueDate: string): boolean {
  const daysLeft = getDaysRemaining(dueDate);
  // Negative days remaining indicates due date has passed. -1 or lower = Day 31+
  return daysLeft <= -1;
}

export interface PaymentImpactResult {
  isFullPayment: boolean;
  remainingCycleBalance: number;
  newNextDeadline: string; // Updated deadline or retained current deadline
  newFeeStatus: StudentFeeStatus;
}

/**
 * Evaluates the impact of a payment according to the required 30-day billing cycle policy:
 * 1. Qualifying Full Payment:
 *    - Clears outstanding balance for the cycle.
 *    - Advances next deadline to payment date + 30 calendar days.
 * 2. Partial Payment:
 *    - Reduces the outstanding balance.
 *    - Retains original due date (does NOT reset the 30-day deadline).
 *    - Sets status to 'partial' (or 'overdue' if already past due date).
 */
export function evaluatePaymentPolicy(
  currentMonthlyFee: number,
  currentOutstandingAmount: number,
  paymentAmount: number,
  paymentDate: string,
  currentDeadline: string
): PaymentImpactResult {
  const effectiveDue = currentOutstandingAmount > 0 ? currentOutstandingAmount : currentMonthlyFee;
  const remaining = Math.max(0, effectiveDue - paymentAmount);
  const isFullPayment = remaining === 0 || paymentAmount >= currentMonthlyFee;

  if (isFullPayment) {
    const nextDeadline = calculateNextDeadline(paymentDate);
    return {
      isFullPayment: true,
      remainingCycleBalance: 0,
      newNextDeadline: nextDeadline,
      newFeeStatus: 'paid',
    };
  } else {
    // Partial payment: retain original due date
    const daysLeft = getDaysRemaining(currentDeadline);
    const newStatus: StudentFeeStatus = daysLeft < 0 ? 'overdue' : 'partial';

    return {
      isFullPayment: false,
      remainingCycleBalance: remaining,
      newNextDeadline: currentDeadline,
      newFeeStatus: newStatus,
    };
  }
}
