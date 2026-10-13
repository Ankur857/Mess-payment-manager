import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { FeeSummary } from '../../types/payment';

interface FeeSummaryCardProps {
  summary: FeeSummary;
}

export const FeeSummaryCard: React.FC<FeeSummaryCardProps> = ({ summary }) => {
  return (
    <View style={styles.container}>
      {/* Primary KPI Card: Total Collected */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroLabel}>Total Fees Collected</Text>
          <View style={styles.heroIconBadge}>
            <Ionicons name="wallet-outline" size={20} color={COLORS.white} />
          </View>
        </View>
        <Text style={styles.heroValue}>₹{summary.totalCollected.toLocaleString()}</Text>
        <View style={styles.heroFooter}>
          <Ionicons name="people-outline" size={14} color="#A3D9B5" />
          <Text style={styles.heroSubtext}>
            {summary.totalActiveStudents} Active Enrolled Students
          </Text>
        </View>
      </View>

      {/* Grid of 3 key sub-metrics */}
      <View style={styles.grid}>
        {/* Outstanding Fees */}
        <View style={[styles.gridCard, { borderLeftColor: COLORS.status.due, borderLeftWidth: 4 }]}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Outstanding</Text>
            <Ionicons name="time-outline" size={16} color={COLORS.status.due} />
          </View>
          <Text style={[styles.metricValue, { color: COLORS.status.due }]}>
            ₹{summary.totalOutstanding.toLocaleString()}
          </Text>
          <Text style={styles.metricSubtext}>Pending collections</Text>
        </View>

        {/* Overdue Students */}
        <View style={[styles.gridCard, { borderLeftColor: COLORS.status.overdue, borderLeftWidth: 4 }]}>
          <View style={styles.metricHeader}>
            <Text style={styles.metricLabel}>Overdue</Text>
            <Ionicons name="alert-circle-outline" size={16} color={COLORS.status.overdue} />
          </View>
          <Text style={[styles.metricValue, { color: COLORS.status.overdue }]}>
            {summary.overdueCount}
          </Text>
          <Text style={styles.metricSubtext}>Students &gt; 30 days</Text>
        </View>
      </View>

      {/* WhatsApp Reminders Bar */}
      <View style={styles.remindersCard}>
        <View style={styles.remindersLeft}>
          <View style={styles.remindersIcon}>
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          </View>
          <View>
            <Text style={styles.remindersTitle}>WhatsApp Reminders</Text>
            <Text style={styles.remindersSubtitle}>
              {summary.upcomingRemindersCount} scheduled for eligible overdue accounts
            </Text>
          </View>
        </View>
        <View style={styles.remindersBadge}>
          <Text style={styles.remindersBadgeText}>{summary.upcomingRemindersCount}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  heroCard: {
    backgroundColor: COLORS.header,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.cardElevated,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  heroLabel: {
    fontSize: 13,
    color: '#A3D9B5',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    marginVertical: SPACING.xs,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  heroSubtext: {
    fontSize: 13,
    color: '#D1E7DD',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  gridCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 2,
  },
  metricSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  remindersCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  remindersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  remindersIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remindersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  remindersSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  remindersBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  remindersBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
});
