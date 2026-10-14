import React, { createContext, useContext, useEffect, useState } from 'react';
import { ReminderService } from '../services/reminderService';
import { ReminderLog } from '../types/reminder';
import { Student } from '../types/student';
import {
  compileReminderMessage,
  generateReminderIdempotencyKey,
  getOverdueDayCount,
  isEligibleForDay31Reminder,
  MAX_RETRY_ATTEMPTS,
} from '../utils/reminderEngine';

interface ReminderContextType {
  reminders: ReminderLog[];
  loading: boolean;
  scanAndGenerateDay31Reminders: (students: Student[]) => Promise<number>;
  sendReminder: (id: string) => Promise<boolean>;
  retryReminder: (id: string) => Promise<boolean>;
  cancelReminder: (id: string) => Promise<void>;
  refreshReminders: () => Promise<void>;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

const DEFAULT_OVERDUE_TEMPLATE =
  'Dear {{student_name}} ({{student_code}}), your monthly fee of ₹{{amount}} was due on {{due_date}} (Day 31 overdue). Kindly make payment today to avoid interruption in classes. Thank you.';

export const ReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reminders, setReminders] = useState<ReminderLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const data = await ReminderService.fetchReminders();
      setReminders(data);
    } catch (e) {
      console.error('Failed to load reminders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  /**
   * Scans active students for Day 31 eligibility and generates idempotent reminder entries
   */
  const scanAndGenerateDay31Reminders = async (students: Student[]): Promise<number> => {
    let generatedCount = 0;

    for (const student of students) {
      // 1. Check eligibility: active, balance > 0, on or past Day 31
      if (!isEligibleForDay31Reminder(student)) continue;

      // 2. Check idempotency: has a reminder already been generated for this student and due date?
      const idempotencyKey = generateReminderIdempotencyKey(student.id, student.nextDeadline);
      const alreadyExists = reminders.some(
        (r) => r.id === idempotencyKey || (r.studentId === student.id && r.dueDate === student.nextDeadline)
      );

      if (alreadyExists) continue;

      // 3. Compile message body with personalization
      const messageText = compileReminderMessage(DEFAULT_OVERDUE_TEMPLATE, student);
      const overdueDayCount = getOverdueDayCount(student.nextDeadline);

      const newReminder: ReminderLog = {
        id: idempotencyKey,
        studentId: student.id,
        studentName: student.name,
        studentCode: student.studentCode,
        studentPhone: student.phone,
        billingCycleId: `bc-${student.id}`,
        dueDate: student.nextDeadline,
        overdueDayCount,
        pendingAmount: student.outstandingAmount,
        messageText,
        status: 'pending',
        scheduledFor: new Date().toISOString(),
        attemptCount: 0,
        isMock: true,
        createdAt: new Date().toISOString(),
      };

      await ReminderService.saveReminder(newReminder);
      setReminders((prev) => [newReminder, ...prev]);
      generatedCount++;
    }

    return generatedCount;
  };

  const sendReminder = async (id: string): Promise<boolean> => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return false;

    const result = await ReminderService.sendMockWhatsApp(reminder);

    if (result.success) {
      await ReminderService.updateReminderStatus(
        id,
        'sent',
        undefined,
        result.providerMessageId
      );
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'sent',
                sentAt: new Date().toISOString(),
                providerMessageId: result.providerMessageId,
                errorMessage: undefined,
                attemptCount: r.attemptCount + 1,
              }
            : r
        )
      );
      return true;
    } else {
      await ReminderService.updateReminderStatus(id, 'failed', result.errorMessage);
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'failed',
                errorMessage: result.errorMessage,
                attemptCount: r.attemptCount + 1,
              }
            : r
        )
      );
      return false;
    }
  };

  const retryReminder = async (id: string): Promise<boolean> => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return false;

    if (reminder.attemptCount >= MAX_RETRY_ATTEMPTS) {
      return false;
    }

    return await sendReminder(id);
  };

  const cancelReminder = async (id: string): Promise<void> => {
    await ReminderService.updateReminderStatus(id, 'cancelled');
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r))
    );
  };

  return (
    <ReminderContext.Provider
      value={{
        reminders,
        loading,
        scanAndGenerateDay31Reminders,
        sendReminder,
        retryReminder,
        cancelReminder,
        refreshReminders: loadReminders,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};

export const useReminders = () => {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
};
