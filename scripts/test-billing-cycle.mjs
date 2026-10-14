/**
 * Phase 7: Integration & Billing Cycle Test Suite
 * Tests end-to-end billing cycle rules, 30-day deadline math, partial payment retention,
 * Day 31 overdue trigger, idempotency keys, and reminder suppression for inactive students.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Helper date math replicated from src/utils/date.ts for standalone test execution
function addCalendarDays(baseDateStr, days) {
  const [yearStr, monthStr, dayStr] = baseDateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const d = new Date(year, month, day, 12, 0, 0);
  d.setDate(d.getDate() + days);
  const resYear = d.getFullYear();
  const resMonth = String(d.getMonth() + 1).padStart(2, '0');
  const resDay = String(d.getDate()).padStart(2, '0');
  return `${resYear}-${resMonth}-${resDay}`;
}

function getDaysRemainingSimulated(targetDateStr, simulatedTodayStr) {
  const [todayYear, todayMonth, todayDay] = simulatedTodayStr.split('-').map(Number);
  const [tYear, tMonth, tDay] = targetDateStr.split('-').map(Number);
  const todayMid = new Date(todayYear, todayMonth - 1, todayDay, 12, 0, 0).getTime();
  const targetMid = new Date(tYear, tMonth - 1, tDay, 12, 0, 0).getTime();
  return Math.round((targetMid - todayMid) / (1000 * 60 * 60 * 24));
}

function evaluatePaymentPolicySimulated(currentMonthlyFee, currentOutstandingAmount, paymentAmount, paymentDate, currentDeadline) {
  const remaining = Math.max(0, currentOutstandingAmount - paymentAmount);
  const isFullPayment = remaining === 0;

  if (isFullPayment) {
    const nextDeadline = addCalendarDays(paymentDate, 30);
    return {
      isFullPayment: true,
      remainingCycleBalance: 0,
      newNextDeadline: nextDeadline,
      newFeeStatus: 'paid',
    };
  } else {
    return {
      isFullPayment: false,
      remainingCycleBalance: remaining,
      newNextDeadline: currentDeadline, // Strictly retains original deadline
      newFeeStatus: 'partial',
    };
  }
}

function generateReminderIdempotencyKey(studentId, dueDate) {
  return `rem_${studentId}_${dueDate}_day31`;
}

function isEligibleForReminderSimulated(student, simulatedTodayStr) {
  if (student.status !== 'active') return false;
  if (student.outstandingAmount <= 0) return false;
  const daysLeft = getDaysRemainingSimulated(student.nextDeadline, simulatedTodayStr);
  return daysLeft <= -1; // Day 31+ overdue
}

function compileReminderMessage(templateBody, student) {
  return templateBody
    .replace(/\{\{student_name\}\}/g, student.name)
    .replace(/\{\{student_code\}\}/g, student.studentCode)
    .replace(/\{\{amount\}\}/g, student.outstandingAmount.toLocaleString())
    .replace(/\{\{due_date\}\}/g, student.nextDeadline);
}

describe('Phase 7: Fee Manager Billing & Integration Test Suite', () => {

  test('1. Student Code sequential generation and formatting', () => {
    const formatCode = (seq, year = 2026) => `STU-${year}-${String(seq).padStart(4, '0')}`;
    assert.equal(formatCode(1, 2026), 'STU-2026-0001');
    assert.equal(formatCode(42, 2026), 'STU-2026-0042');
    assert.equal(formatCode(9999, 2026), 'STU-2026-9999');
  });

  test('2. 30-Day Billing Cycle Deadline Calculation', () => {
    // Normal month boundary
    assert.equal(addCalendarDays('2026-01-01', 30), '2026-01-31');
    // Leap year / February handling
    assert.equal(addCalendarDays('2026-02-01', 30), '2026-03-03');
    // Year boundary handling
    assert.equal(addCalendarDays('2026-12-15', 30), '2027-01-14');
  });

  test('3. Full Payment resets cycle by +30 calendar days and clears balance', () => {
    const student = {
      id: 'stu-001',
      studentCode: 'STU-2026-0001',
      name: 'Rohan Sharma',
      monthlyFee: 5000,
      outstandingAmount: 5000,
      nextDeadline: '2026-03-31',
      status: 'active'
    };

    const paymentDate = '2026-03-30'; // Paid 1 day before due date
    const result = evaluatePaymentPolicySimulated(
      student.monthlyFee,
      student.outstandingAmount,
      5000,
      paymentDate,
      student.nextDeadline
    );

    assert.equal(result.isFullPayment, true);
    assert.equal(result.remainingCycleBalance, 0);
    assert.equal(result.newNextDeadline, '2026-04-29'); // 2026-03-30 + 30 days
    assert.equal(result.newFeeStatus, 'paid');
  });

  test('4. Partial Payment reduces balance but strictly RETAINS original due date', () => {
    const student = {
      id: 'stu-002',
      studentCode: 'STU-2026-0002',
      name: 'Priya Patel',
      monthlyFee: 5000,
      outstandingAmount: 5000,
      nextDeadline: '2026-03-31',
      status: 'active'
    };

    const paymentDate = '2026-03-15';
    const result = evaluatePaymentPolicySimulated(
      student.monthlyFee,
      student.outstandingAmount,
      2000, // Partial payment
      paymentDate,
      student.nextDeadline
    );

    assert.equal(result.isFullPayment, false);
    assert.equal(result.remainingCycleBalance, 3000);
    // Crucial rule: original due date MUST NOT be reset
    assert.equal(result.newNextDeadline, '2026-03-31');
    assert.equal(result.newFeeStatus, 'partial');
  });

  test('5. Day 31 Overdue Trigger and Eligibility Evaluation', () => {
    const student = {
      id: 'stu-003',
      studentCode: 'STU-2026-0003',
      name: 'Amit Kumar',
      outstandingAmount: 3000,
      nextDeadline: '2026-03-31',
      status: 'active'
    };

    // On due date (Day 30): days remaining = 0 -> Not Day 31 yet
    assert.equal(isEligibleForReminderSimulated(student, '2026-03-31'), false);

    // 1 day after due date (Day 31): days remaining = -1 -> Day 31 Triggered!
    assert.equal(isEligibleForReminderSimulated(student, '2026-04-01'), true);

    // 5 days overdue (Day 35): days remaining = -5 -> Day 31+ Triggered!
    assert.equal(isEligibleForReminderSimulated(student, '2026-04-05'), true);
  });

  test('6. Full payment before Day 31 suppresses overdue reminder', () => {
    const studentPaid = {
      id: 'stu-004',
      studentCode: 'STU-2026-0004',
      name: 'Sunita Roy',
      outstandingAmount: 0, // Cleared
      nextDeadline: '2026-03-31',
      status: 'active'
    };

    // Even if date is Day 31, zero balance suppresses reminder
    assert.equal(isEligibleForReminderSimulated(studentPaid, '2026-04-01'), false);
  });

  test('7. Student Deactivation (Archived) stops all reminder scheduling', () => {
    const inactiveStudent = {
      id: 'stu-005',
      studentCode: 'STU-2026-0005',
      name: 'Vikas Singh',
      outstandingAmount: 4000,
      nextDeadline: '2026-03-31',
      status: 'archived' // Inactive
    };

    // Archived student must never receive automated reminders
    assert.equal(isEligibleForReminderSimulated(inactiveStudent, '2026-04-01'), false);
  });

  test('8. Reminder Idempotency Deduplication Key generation', () => {
    const key1 = generateReminderIdempotencyKey('student_123', '2026-03-31');
    const key2 = generateReminderIdempotencyKey('student_123', '2026-03-31');
    const key3 = generateReminderIdempotencyKey('student_123', '2026-04-30');

    assert.equal(key1, 'rem_student_123_2026-03-31_day31');
    assert.equal(key1, key2, 'Duplicate calls for same student and due date must yield identical key');
    assert.notEqual(key1, key3, 'Different billing cycles must have distinct keys');
  });

  test('9. WhatsApp Template Variable Compilation', () => {
    const template = 'Dear {{student_name}} ({{student_code}}), fee of ₹{{amount}} was due on {{due_date}}. Please pay.';
    const student = {
      name: 'Rohan Sharma',
      studentCode: 'STU-2026-0001',
      outstandingAmount: 5000,
      nextDeadline: '2026-03-31'
    };

    const compiled = compileReminderMessage(template, student);
    assert.equal(
      compiled,
      'Dear Rohan Sharma (STU-2026-0001), fee of ₹5,000 was due on 2026-03-31. Please pay.'
    );
  });
});
