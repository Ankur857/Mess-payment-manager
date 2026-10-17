import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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

type StudentTabFilter = 'all' | 'paid' | 'due' | 'overdue';

export default function DashboardScreen() {
  const router = useRouter();
  const { students, refreshStudents } = useStudents();
  const { payments, refreshPayments } = usePayments();
  const { reminders, refreshReminders } = useReminders();
  const [refreshing, setRefreshing] = useState(false);
  const [studentFilter, setStudentFilter] = useState<StudentTabFilter>('all');

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshStudents(), refreshPayments(), refreshReminders()]);
    setRefreshing(false);
  };

  const activeStudents = students.filter((s) => s.status === 'active');
  const paidStudents = activeStudents.filter((s) => s.feeStatus === 'paid');
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

  const displayedStudents = useMemo(() => {
    switch (studentFilter) {
      case 'paid':
        return paidStudents;
      case 'due':
        return dueSoonStudents;
      case 'overdue':
        return overdueStudents;
      case 'all':
      default:
        return activeStudents;
    }
  }, [studentFilter, activeStudents, paidStudents, dueSoonStudents, overdueStudents]);

  const recentPayments = payments.slice(0, 5);

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

      {/* Enrolled Students Directory Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="people" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Enrolled Students</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{activeStudents.length}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/students')}>
          <Text style={styles.seeAllText}>See all ({students.length})</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Filter Tabs for Students */}
      <View style={styles.filterTabsRow}>
        <TouchableOpacity
          style={[styles.filterChip, studentFilter === 'all' ? styles.filterChipActive : null]}
          onPress={() => setStudentFilter('all')}
        >
          <Text style={[styles.filterChipText, studentFilter === 'all' ? styles.filterChipTextActive : null]}>
            All ({activeStudents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, studentFilter === 'paid' ? styles.filterChipActivePaid : null]}
          onPress={() => setStudentFilter('paid')}
        >
          <Text style={[styles.filterChipText, studentFilter === 'paid' ? styles.filterChipTextActivePaid : null]}>
            Paid ({paidStudents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, studentFilter === 'due' ? styles.filterChipActiveDue : null]}
          onPress={() => setStudentFilter('due')}
        >
          <Text style={[styles.filterChipText, studentFilter === 'due' ? styles.filterChipTextActiveDue : null]}>
            Due Soon ({dueSoonStudents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, studentFilter === 'overdue' ? styles.filterChipActiveOverdue : null]}
          onPress={() => setStudentFilter('overdue')}
        >
          <Text style={[styles.filterChipText, studentFilter === 'overdue' ? styles.filterChipTextActiveOverdue : null]}>
            Overdue ({overdueStudents.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Student Cards List */}
      {displayedStudents.length > 0 ? (
        displayedStudents.map((student) => (
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
          icon={studentFilter === 'paid' ? 'cash-outline' : 'checkmark-circle-outline'}
          title={
            studentFilter === 'paid'
              ? 'No Paid Students Yet'
              : studentFilter === 'overdue'
              ? 'No Overdue Students!'
              : studentFilter === 'due'
              ? 'No Fees Due Soon'
              : 'No Active Students'
          }
          description={
            studentFilter === 'paid'
              ? 'Payments recorded for students will appear here.'
              : studentFilter === 'overdue'
              ? 'All active students are up to date on their payments.'
              : 'Add new students to start tracking their monthly fees.'
          }
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
              <TouchableOpacity
                style={styles.paymentRow}
                activeOpacity={0.7}
                onPress={() => {
                  if (payment.studentId) {
                    router.push({
                      pathname: '/students/[id]',
                      params: { id: payment.studentId },
                    });
                  }
                }}
              >
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
                <View style={styles.paymentAmountContainer}>
                  <Text style={styles.paymentAmount}>+₹{payment.amount.toLocaleString()}</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
                </View>
              </TouchableOpacity>
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
  filterTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipActivePaid: {
    backgroundColor: COLORS.status.paid,
    borderColor: COLORS.status.paid,
  },
  filterChipActiveDue: {
    backgroundColor: COLORS.status.due,
    borderColor: COLORS.status.due,
  },
  filterChipActiveOverdue: {
    backgroundColor: COLORS.status.overdue,
    borderColor: COLORS.status.overdue,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  filterChipTextActivePaid: {
    color: COLORS.white,
    fontWeight: '700',
  },
  filterChipTextActiveDue: {
    color: COLORS.white,
    fontWeight: '700',
  },
  filterChipTextActiveOverdue: {
    color: COLORS.white,
    fontWeight: '700',
  },
  paymentAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
