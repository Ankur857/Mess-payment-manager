import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { ReminderLog, ReminderStatus } from '../types/reminder';
import { generateMockProviderMessageId } from '../utils/reminderEngine';
import { WhatsAppApiService } from './whatsappApiService';

const STORAGE_KEYS = {
  REMINDERS: '@fee_manager_reminders_v2',
};

export const ReminderService = {
  async fetchReminders(): Promise<ReminderLog[]> {
    if (!isSupabaseConfigured) {
      return await this.getLocalReminders();
    }

    try {
      const { data, error } = await supabase
        .from('reminder_logs')
        .select('*')
        .order('scheduled_for', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        return await this.getLocalReminders();
      }

      return data.map((row: any) => ({
        id: row.id,
        studentId: row.student_id,
        studentName: row.message_text.split(',')[0].replace('Dear ', '').trim() || 'Student',
        studentCode: '',
        studentPhone: '',
        billingCycleId: row.billing_cycle_id || '',
        dueDate: row.due_date,
        overdueDayCount: row.overdue_day_count,
        pendingAmount: Number(row.pending_amount),
        messageText: row.message_text,
        status: row.status,
        scheduledFor: row.scheduled_for,
        sentAt: row.sent_at || undefined,
        providerMessageId: row.provider_message_id || undefined,
        errorMessage: row.error_message || undefined,
        attemptCount: row.attempt_count || 0,
        isMock: row.is_mock ?? true,
        createdAt: row.created_at,
      }));
    } catch (err) {
      console.warn('Failed to fetch reminder logs from Supabase, using local fallback:', err);
      return await this.getLocalReminders();
    }
  },

  async saveReminder(reminder: ReminderLog): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('reminder_logs').insert({
          id: reminder.id,
          student_id: reminder.studentId,
          due_date: reminder.dueDate,
          overdue_day_count: reminder.overdueDayCount,
          pending_amount: reminder.pendingAmount,
          message_text: reminder.messageText,
          status: reminder.status,
          scheduled_for: reminder.scheduledFor,
          is_mock: reminder.isMock,
        });
      } catch (e) {
        console.warn('Failed to insert reminder log in Supabase:', e);
      }
    }

    const local = await this.getLocalReminders();
    const existingIndex = local.findIndex((r) => r.id === reminder.id);
    let updated: ReminderLog[];
    if (existingIndex >= 0) {
      updated = [...local];
      updated[existingIndex] = reminder;
    } else {
      updated = [reminder, ...local];
    }
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updated));
  },

  async updateReminderStatus(
    id: string,
    status: ReminderStatus,
    errorMessage?: string,
    providerMessageId?: string
  ): Promise<void> {
    const sentAt = status === 'sent' ? new Date().toISOString() : undefined;

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('reminder_logs')
          .update({
            status,
            sent_at: sentAt,
            provider_message_id: providerMessageId,
            error_message: errorMessage || null,
          })
          .eq('id', id);
      } catch (e) {
        console.warn('Failed to update reminder status in Supabase:', e);
      }
    }

    const local = await this.getLocalReminders();
    const updated = local.map((rem) => {
      if (rem.id !== id) return rem;
      return {
        ...rem,
        status,
        sentAt: sentAt || rem.sentAt,
        providerMessageId: providerMessageId || rem.providerMessageId,
        errorMessage: errorMessage !== undefined ? errorMessage : rem.errorMessage,
        attemptCount: rem.attemptCount + 1,
      };
    });
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(updated));
  },

  /**
   * Dispatches WhatsApp reminder via backend Supabase Edge Function or mock simulation.
   */
  async sendMockWhatsApp(reminder: ReminderLog): Promise<{
    success: boolean;
    providerMessageId?: string;
    errorMessage?: string;
  }> {
    const result = await WhatsAppApiService.dispatchReminder(reminder);
    return {
      success: result.success,
      providerMessageId: result.providerMessageId,
      errorMessage: result.errorMessage,
    };
  },

  async getLocalReminders(): Promise<ReminderLog[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (!data) return [];
      const parsed: ReminderLog[] = JSON.parse(data);
      // Clean out any legacy seed entries
      const sanitized = parsed.filter(
        (r) => !r.id.includes('seed') && !r.id.includes('test') && !r.studentPhone.includes('8574117424')
      );
      if (sanitized.length !== parsed.length) {
        await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(sanitized));
      }
      return sanitized;
    } catch {
      return [];
    }
  },
};
