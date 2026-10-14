import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { ReminderLog } from '../../types/reminder';
import { formatDisplayDate } from '../../utils/date';
import { ReminderStatusBadge } from './ReminderStatusBadge';

interface ReminderTimelineCardProps {
  reminder: ReminderLog;
  onSendNow?: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
}

export const ReminderTimelineCard: React.FC<ReminderTimelineCardProps> = ({
  reminder,
  onSendNow,
  onRetry,
  onCancel,
}) => {
  const handleOpenWhatsAppDirect = () => {
    const rawDigits = reminder.studentPhone.replace(/[^0-9]/g, '');
    const phoneWithCountry = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;
    const url = `whatsapp://send?phone=${phoneWithCountry}&text=${encodeURIComponent(reminder.messageText)}`;
    const webFallback = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(reminder.messageText)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(webFallback);
        }
      })
      .catch(() => {
        Linking.openURL(webFallback);
      });
  };
  return (
    <View style={styles.card}>
      {/* Top Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.waIconBox}>
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          </View>
          <View>
            <Text style={styles.studentName}>{reminder.studentName}</Text>
            <Text style={styles.codeText}>
              {reminder.studentCode} • {reminder.studentPhone}
            </Text>
          </View>
        </View>
        <ReminderStatusBadge status={reminder.status} isMock={reminder.isMock} />
      </View>

      {/* Overdue Alert Banner */}
      <View style={styles.overdueBanner}>
        <Ionicons name="time-outline" size={14} color={COLORS.status.overdue} />
        <Text style={styles.overdueBannerText}>
          Day {reminder.overdueDayCount} Overdue • Due was {formatDisplayDate(reminder.dueDate)}
        </Text>
      </View>

      {/* Message Bubble Preview */}
      <View style={styles.messagePreviewBox}>
        <Text style={styles.messageText} numberOfLines={3}>
          &ldquo;{reminder.messageText}&rdquo;
        </Text>
      </View>

      {/* Meta Details Table */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Pending Fee</Text>
          <Text style={styles.metaAmount}>₹{reminder.pendingAmount.toLocaleString()}</Text>
        </View>

        <View style={styles.metaItemRight}>
          <Text style={styles.metaLabel}>
            {reminder.status === 'sent' ? 'Delivered At' : 'Scheduled For'}
          </Text>
          <Text style={styles.metaDate}>
            {reminder.status === 'sent'
              ? reminder.sentAt?.replace('T', ' ').slice(0, 16)
              : reminder.scheduledFor.replace('T', ' ').slice(0, 16)}
          </Text>
        </View>
      </View>

      {/* Provider Details & Attempts */}
      {reminder.providerMessageId ? (
        <View style={styles.providerRow}>
          <Ionicons name="checkmark-done" size={14} color={COLORS.primary} />
          <Text style={styles.providerText} numberOfLines={1}>
            ID: {reminder.providerMessageId}
          </Text>
        </View>
      ) : null}

      {reminder.errorMessage ? (
        <View style={styles.errorBox}>
          <Ionicons name="warning-outline" size={14} color={COLORS.error} />
          <Text style={styles.errorText}>
            Attempt {reminder.attemptCount}: {reminder.errorMessage}
          </Text>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {reminder.status === 'pending' && onSendNow ? (
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={onSendNow} activeOpacity={0.8}>
            <Ionicons name="paper-plane-outline" size={14} color={COLORS.white} />
            <Text style={styles.actionBtnPrimaryText}>Send Now</Text>
          </TouchableOpacity>
        ) : null}

        {/* Real WhatsApp Direct Testing Action */}
        <TouchableOpacity
          style={styles.actionBtnWhatsApp}
          onPress={handleOpenWhatsAppDirect}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
          <Text style={styles.actionBtnWhatsAppText}>Open WhatsApp</Text>
        </TouchableOpacity>

        {reminder.status === 'failed' && onRetry ? (
          <TouchableOpacity style={styles.actionBtnRetry} onPress={onRetry} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={14} color={COLORS.primaryDark} />
            <Text style={styles.actionBtnRetryText}>Retry</Text>
          </TouchableOpacity>
        ) : null}

        {reminder.status === 'pending' && onCancel ? (
          <TouchableOpacity style={styles.actionBtnCancel} onPress={onCancel} activeOpacity={0.8}>
            <Text style={styles.actionBtnCancelText}>Cancel</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md + 2,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  waIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  codeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.status.overdueBg,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  overdueBannerText: {
    fontSize: 12,
    color: COLORS.status.overdue,
    fontWeight: '700',
  },
  messagePreviewBox: {
    backgroundColor: '#F8FAF9',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: '#25D366',
    marginBottom: SPACING.sm,
  },
  messageText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  metaItem: {
    flex: 1,
  },
  metaItemRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  metaAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.status.due,
    marginTop: 1,
  },
  metaDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  providerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs + 2,
    backgroundColor: COLORS.errorLight,
    padding: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
  },
  errorText: {
    fontSize: 11,
    color: COLORS.error,
    fontWeight: '600',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.xs,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs + 4,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  actionBtnPrimaryText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnWhatsApp: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E8F8EE',
    borderWidth: 1,
    borderColor: '#A3E6B8',
    paddingVertical: SPACING.xs + 4,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  actionBtnWhatsAppText: {
    color: '#0D6832',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnRetry: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.xs + 4,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  actionBtnRetryText: {
    color: COLORS.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnCancel: {
    paddingVertical: SPACING.xs + 4,
    paddingHorizontal: SPACING.md,
  },
  actionBtnCancelText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
