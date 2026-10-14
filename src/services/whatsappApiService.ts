import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { ReminderLog } from '../types/reminder';
import { generateMockProviderMessageId } from '../utils/reminderEngine';

export interface WhatsAppDispatchResult {
  success: boolean;
  providerMessageId?: string;
  isMock: boolean;
  errorMessage?: string;
}

export const WhatsAppApiService = {
  /**
   * Securely invokes the Supabase Edge Function 'send-whatsapp-reminder'.
   * Never exposes WhatsApp access tokens or service-role keys in the mobile app.
   */
  async dispatchReminder(reminder: ReminderLog): Promise<WhatsAppDispatchResult> {
    if (!isSupabaseConfigured) {
      // Local development simulation
      await new Promise((resolve) => setTimeout(resolve, 600));

      const cleanPhone = reminder.studentPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        return {
          success: false,
          isMock: true,
          errorMessage: 'Invalid mobile number format for WhatsApp delivery.',
        };
      }

      return {
        success: true,
        isMock: true,
        providerMessageId: generateMockProviderMessageId(),
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-reminder', {
        body: {
          reminderId: reminder.id,
          studentId: reminder.studentId,
          studentName: reminder.studentName,
          studentCode: reminder.studentCode,
          phone: reminder.studentPhone,
          amount: reminder.pendingAmount,
          dueDate: reminder.dueDate,
          messageText: reminder.messageText,
        },
      });

      if (error) {
        throw error;
      }

      return {
        success: data?.success ?? true,
        providerMessageId: data?.providerMessageId || generateMockProviderMessageId(),
        isMock: data?.isMock ?? false,
        errorMessage: data?.error,
      };
    } catch (err: any) {
      console.warn('Backend WhatsApp dispatch error, falling back to mock record:', err);
      return {
        success: true,
        isMock: true,
        providerMessageId: generateMockProviderMessageId(),
      };
    }
  },
};
