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
import { FeeSummaryCard } from '../../components/dashboard/FeeSummaryCard';
import { StudentCard } from '../../components/students/StudentCard';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { FeeSummary, Payment } from '../../types/payment';
import { Student } from '../../types/student';

// Placeholder initial data for Phase 1 UI validation
const INITIAL_SUMMARY: FeeSummary = {
  totalActiveStudents: 42,
  totalCollected: 128500,
  totalOutstanding: 21500,
  dueSoonCount: 5,
  overdueCount: 3,
  upcomingRemindersCount: 3,
};

const SAMPLE_OVERDUE_STUDENTS: Student[] = [
  {
    id: 'stu-1',
    studentCode: 'STU-2026-0001',
    name: 'Aarav Sharma',
    phone: '+919876543210',
    parentName: 'Ramesh Sharma',
    parentPhone: '+919876543211',
    monthlyFee: 3500,
    status: 'active',
    admissionDate: '2026-01-10',
    feeStatus: 'overdue',
    lastPaymentDate: '2026-01-10',
    nextDeadline: '2026-02-09',
    daysRemaining: -4,
    outstandingAmount: 3500,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-02-09T10:00:00Z',
  },
  {
    id: 'stu-2',
    studentCode: 'STU-2026-0002',
    name: 'Diya Patel',
    phone: '+919876500001',
    monthlyFee: 4000,
    status: 'active',
    admissionDate: '2026-01-12',
    feeStatus: 'overdue',
    lastPaymentDate: '2026-01-12',
    nextDeadline: '2026-02-11',
    daysRemaining: -2,
    outstandingAmount: 4000,
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-02-11T10:00:00Z',
  },
];

const RECENT_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    studentId: 'stu-3',
    studentName: 'Vihaan Verma',
    studentCode: 'STU-2026-0003',
    amount: 3500,
    paymentDate: '2026-02-13',
    paymentMethod: 'upi',
    transactionRef: 'UPI/6044192834',
    createdAt: '2026-02-13T14:30:00Z',
  },
  {
    id: 'pay-2',
    studentId: 'stu-4',
    studentName: 'Ananya Iyer',
    studentCode: 'STU-2026-0004',
    amount: 4500,
    paymentDate: '2026-02-12',
    paymentMethod: 'cash',
    createdAt: '2026-02-12T11:15:00Z',
  },
];

export default function DashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

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
      <FeeSummaryCard summary={INITIAL_SUMMARY} />

      {/* Overdue Students Alert Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="alert-circle" size={20} color={COLORS.status.overdue} />
          <Text style={styles.sectionTitle}>Overdue Students</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{SAMPLE_OVERDUE_STUDENTS.length}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/students')}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      {SAMPLE_OVERDUE_STUDENTS.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          onPress={() =>
            router.push({
              pathname: '/students/[id]/index',
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
      ))}

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
        {RECENT_PAYMENTS.map((payment, index) => (
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
                <Text style={styles.paymentStudentName}>{payment.studentName}</Text>
                <Text style={styles.paymentMeta}>
                  {payment.studentCode} • {payment.paymentMethod.toUpperCase()} • {payment.paymentDate}
                </Text>
              </View>
              <Text style={styles.paymentAmount}>+₹{payment.amount.toLocaleString()}</Text>
            </View>
            {index < RECENT_PAYMENTS.length - 1 ? <View style={styles.paymentDivider} /> : null}
          </View>
        ))}
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
    fontWeight: '700',
    color: COLORS.status.paid,
  },
  paymentDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 4,
  },
});
