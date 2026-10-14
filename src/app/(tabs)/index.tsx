import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { FeeSummaryCard } from '../../components/dashboard/FeeSummaryCard';
import { StudentCard } from '../../components/students/StudentCard';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { usePayments } from '../../context/PaymentContext';
import { useReminders } from '../../context/ReminderContext';
import { useStudents } from '../../context/StudentContext';
import { FeeSummary } from '../../types/payment';

export default function DashboardScreen() {
  const router = useRouter();
  const { students, refreshStudents } = useStudents();
  const { payments, refreshPayments } = usePayments();
  const { reminders, refreshReminders } = useReminders();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshStudents(), refreshPayments(), refreshReminders()]);
    setRefreshing(false);
  };

  const activeStudents = students.filter((s) => s.status === 'active');
  const overdueStudents = activeStudents.filter((s) => s.feeStatus === 'overdue');
  const dueSoonStudents = activeStudents.filter((s) => s.feeStatus === 'due');
  const totalOutstanding = activeStudents.reduce((sum, s) => sum + s.outstandingAmount, 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const pendingRemindersCount = reminders.filter((r) => r.status === 'pending').length;

  const dynamicSummary: FeeSummary = {
    totalActiveStudents: activeStudents.length,
    totalCollected,
    totalOutstanding,
    dueSoonCount: dueSoonStudents.length,
    overdueCount: overdueStudents.length,
    upcomingRemindersCount: pendingRemindersCount,
  };

  const recentPayments = payments.slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* Quick Action Buttons */}
      <View style={styles.actionRow}>
        <Button
          title="Add Student"
          icon={<Ionicons name="person-add-outline" size={18} color={COLORS.white} />}
          onPress={() => router.push('/students/add')}
          style={styles.actionBtn}
        />
        <Button
          title="Students List"
          variant="secondary"
          icon={<Ionicons name="people-outline" size={18} color={COLORS.primaryDark} />}
          onPress={() => router.push('/(tabs)/students')}
          style={styles.actionBtn}
        />
      </View>

      {/* Main KPI Overview Card */}
      <FeeSummaryCard summary={dynamicSummary} />

      {/* Overdue Students Alert Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="alert-circle" size={20} color={COLORS.status.overdue} />
          <Text style={styles.sectionTitle}>Overdue Students</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{overdueStudents.length}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/students')}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      {overdueStudents.length > 0 ? (
        overdueStudents.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            onPress={() =>
              router.push({
                pathname: '/students/[id]',
                params: { id: student.id },
              })
            }
            onRecordPayment={() =>
              router.push({
                pathname: '/students/[id]/record-payment',
                params: { id: student.id },
              })
            }
          />
        ))
      ) : (
        <EmptyState
          icon="checkmark-circle-outline"
          title="No Overdue Fees!"
          description="All active students are up to date on their payments."
          style={{ paddingVertical: SPACING.lg }}
        />
      )}

      {/* Recent Payments Section */}
      <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Recent Payments</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/payments')}>
          <Text style={styles.seeAllText}>View ledger</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.paymentsListCard}>
        {recentPayments.length > 0 ? (
          recentPayments.map((payment, index) => (
            <View key={payment.id}>
              <View style={styles.paymentRow}>
                <View style={styles.paymentIconBadge}>
                  <Ionicons
                    name={payment.paymentMethod === 'upi' ? 'qr-code-outline' : 'cash-outline'}
                    size={18}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentStudentName}>{payment.studentName || 'Student Payment'}</Text>
                  <Text style={styles.paymentMeta}>
                    {payment.studentCode} • {payment.paymentMethod.toUpperCase()} • {payment.paymentDate}
                  </Text>
                </View>
                <Text style={styles.paymentAmount}>+₹{payment.amount.toLocaleString()}</Text>
              </View>
              {index < recentPayments.length - 1 ? <View style={styles.paymentDivider} /> : null}
            </View>
          ))
        ) : (
          <Text style={styles.emptyPaymentsText}>No payments recorded yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actionBtn: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  badgeCount: {
    backgroundColor: COLORS.status.overdueBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgeCountText: {
    color: COLORS.status.overdue,
    fontSize: 12,
    fontWeight: '700',
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  paymentsListCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  paymentIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentStudentName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  paymentMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.status.paid,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 4,
  },
  emptyPaymentsText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
});
