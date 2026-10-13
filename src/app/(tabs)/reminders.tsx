import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState } from '../../components/common/EmptyState';
import { ReminderStatusBadge } from '../../components/reminders/ReminderStatusBadge';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { ReminderLog, ReminderStatus } from '../../types/reminder';

const SAMPLE_REMINDERS: ReminderLog[] = [
  {
    id: 'rem-1',
    studentId: 'stu-1',
    studentName: 'Aarav Sharma',
    studentCode: 'STU-2026-0001',
    studentPhone: '+919876543210',
    billingCycleId: 'bc-1',
    dueDate: '2026-02-09',
    overdueDayCount: 31,
    pendingAmount: 3500,
    messageText:
      'Dear Aarav Sharma (STU-2026-0001), your fee of ₹3,500 was due on 2026-02-09 (Day 31 overdue). Kindly complete payment today.',
    status: 'pending',
    scheduledFor: '2026-02-14T09:00:00Z',
    attemptCount: 0,
    isMock: true,
    createdAt: '2026-02-13T10:00:00Z',
  },
  {
    id: 'rem-2',
    studentId: 'stu-2',
    studentName: 'Diya Patel',
    studentCode: 'STU-2026-0002',
    studentPhone: '+919876500001',
    billingCycleId: 'bc-2',
    dueDate: '2026-02-11',
    overdueDayCount: 31,
    pendingAmount: 4000,
    messageText:
      'Dear Diya Patel (STU-2026-0002), your monthly fee of ₹4,000 is pending since 2026-02-11. Please clear the outstanding balance.',
    status: 'sent',
    scheduledFor: '2026-02-12T09:00:00Z',
    sentAt: '2026-02-12T09:02:14Z',
    providerMessageId: 'wamid.HBgLMjUxOTg3NjUwMDAxFQIAERgSMTQ1',
    attemptCount: 1,
    isMock: true,
    createdAt: '2026-02-11T12:00:00Z',
  },
  {
    id: 'rem-3',
    studentId: 'stu-5',
    studentName: 'Rohit Deshmukh',
    studentCode: 'STU-2026-0005',
    studentPhone: '+919876500099',
    billingCycleId: 'bc-5',
    dueDate: '2026-02-01',
    overdueDayCount: 31,
    pendingAmount: 5000,
    messageText:
      'Dear Rohit Deshmukh, reminder for pending fee ₹5,000.',
    status: 'failed',
    scheduledFor: '2026-02-02T09:00:00Z',
    errorMessage: 'Recipient phone number not registered on WhatsApp',
    attemptCount: 3,
    isMock: true,
    createdAt: '2026-02-01T10:00:00Z',
  },
];

type FilterTab = 'all' | ReminderStatus;

export default function RemindersScreen() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filteredList = SAMPLE_REMINDERS.filter((rem) => {
    if (activeTab === 'all') return true;
    return rem.status === activeTab;
  });

  const tabs: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'all' },
    { label: 'Upcoming', value: 'pending' },
    { label: 'Sent', value: 'sent' },
    { label: 'Failed', value: 'failed' },
  ];

  return (
    <View style={styles.container}>
      {/* Notice Banner */}
      <View style={styles.noticeCard}>
        <View style={styles.noticeIcon}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
        </View>
        <Text style={styles.noticeText}>
          Automated WhatsApp reminders are sent on Day 31 for overdue accounts with an outstanding balance.
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              style={[styles.tabChip, isActive ? styles.tabChipActive : null]}
              onPress={() => setActiveTab(tab.value)}
            >
              <Text style={[styles.tabText, isActive ? styles.tabTextActive : null]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Reminder List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                <Text style={styles.studentName}>{item.studentName}</Text>
              </View>
              <ReminderStatusBadge status={item.status} isMock={item.isMock} />
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{item.studentCode}</Text>
              <Text style={styles.metaBullet}>•</Text>
              <Text style={styles.metaText}>{item.studentPhone}</Text>
              <Text style={styles.metaBullet}>•</Text>
              <Text style={styles.overdueHighlight}>Day {item.overdueDayCount} Overdue</Text>
            </View>

            <View style={styles.messagePreviewBox}>
              <Text style={styles.messageText} numberOfLines={3}>
                &ldquo;{item.messageText}&rdquo;
              </Text>
            </View>

            <View style={styles.footerRow}>
              <View>
                <Text style={styles.footerLabel}>Pending Amount</Text>
                <Text style={styles.footerAmount}>₹{item.pendingAmount.toLocaleString()}</Text>
              </View>
              <View style={styles.rightFooter}>
                <Text style={styles.footerLabel}>
                  {item.status === 'sent' ? 'Sent On' : 'Scheduled For'}
                </Text>
                <Text style={styles.footerDate}>
                  {item.status === 'sent' ? item.sentAt?.slice(0, 10) : item.scheduledFor.slice(0, 10)}
                </Text>
              </View>
            </View>

            {item.errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="warning-outline" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>Error: {item.errorMessage}</Text>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No Reminders Found"
            description="No reminder logs match the current tab filter."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    gap: SPACING.sm,
  },
  noticeIcon: {
    justifyContent: 'center',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primaryDark,
    lineHeight: 17,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  tabChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  metaBullet: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  overdueHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.status.overdue,
  },
  messagePreviewBox: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#25D366',
  },
  messageText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  footerLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  footerAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  rightFooter: {
    alignItems: 'flex-end',
  },
  footerDate: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
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
});
