import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../../constants/theme';
import { Payment } from '../../../types/payment';
import { Student } from '../../../types/student';

// Placeholder student profile data
const MOCK_STUDENT: Student = {
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
};

const MOCK_STUDENT_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    studentId: 'stu-1',
    amount: 3500,
    paymentDate: '2026-01-10',
    paymentMethod: 'bank_transfer',
    transactionRef: 'IMPS/99812401',
    notes: 'Admission month fee paid',
    createdAt: '2026-01-10T10:00:00Z',
  },
];

export default function StudentProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [student, setStudent] = useState<Student>(MOCK_STUDENT);
  const [archiveVisible, setArchiveVisible] = useState(false);

  const handleDeactivate = () => {
    setStudent((prev) => ({
      ...prev,
      status: prev.status === 'active' ? 'inactive' : 'active',
    }));
    setArchiveVisible(false);
    Alert.alert(
      'Updated',
      student.status === 'active'
        ? 'Student has been deactivated. Automatic reminders are paused.'
        : 'Student has been reactivated.'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarContainer}>
            {student.photoUrl ? (
              <Image source={{ uri: student.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {student.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.profileMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {student.name}
              </Text>
            </View>
            <Text style={styles.codeText}>{student.studentCode}</Text>
            <View style={styles.badgeRow}>
              <Badge status={student.feeStatus} />
              <Badge status={student.status} />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Button
            title="Record Payment"
            icon={<Ionicons name="card-outline" size={16} color={COLORS.white} />}
            onPress={() =>
              router.push({
                pathname: '/students/[id]/record-payment',
                params: { id: String(id || student.id) },
              })
            }
            style={styles.actionButton}
          />
          <Button
            title="Edit"
            variant="outline"
            icon={<Ionicons name="create-outline" size={16} color={COLORS.primary} />}
            onPress={() =>
              router.push({
                pathname: '/students/[id]/edit',
                params: { id: String(id || student.id) },
              })
            }
            style={styles.editButton}
          />
        </View>
      </View>

      {/* 30-Day Billing Cycle Status Card */}
      <View style={styles.billingCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
          <Text style={styles.cardTitle}>30-Day Billing Cycle</Text>
        </View>

        <View style={styles.billingGrid}>
          <View style={styles.billingItem}>
            <Text style={styles.billingLabel}>Last Payment Date</Text>
            <Text style={styles.billingValue}>{student.lastPaymentDate || 'None'}</Text>
          </View>
          <View style={styles.billingItem}>
            <Text style={styles.billingLabel}>Next Deadline (+30 Days)</Text>
            <Text style={[styles.billingValue, styles.overdueDate]}>{student.nextDeadline}</Text>
          </View>
          <View style={styles.billingItem}>
            <Text style={styles.billingLabel}>Days Remaining</Text>
            <Text
              style={[
                styles.billingValue,
                student.daysRemaining < 0 ? styles.overdueValue : styles.positiveValue,
              ]}
            >
              {student.daysRemaining < 0
                ? `${Math.abs(student.daysRemaining)} Days Overdue`
                : `${student.daysRemaining} Days Left`}
            </Text>
          </View>
          <View style={styles.billingItem}>
            <Text style={styles.billingLabel}>Outstanding Amount</Text>
            <Text style={[styles.billingValue, styles.outstandingValue]}>
              ₹{student.outstandingAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.cycleNotice}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primaryDark} />
          <Text style={styles.cycleNoticeText}>
            When admin marks &ldquo;Payment Done&rdquo;, next deadline is set to +30 calendar days. WhatsApp overdue notice sends on Day 31.
          </Text>
        </View>
      </View>

      {/* Contact Details Card */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Contact Information</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <Ionicons name="call-outline" size={16} color={COLORS.primary} />
          </View>
          <View style={styles.infoTextBox}>
            <Text style={styles.infoLabel}>Student WhatsApp / Phone</Text>
            <Text style={styles.infoValue}>{student.phone}</Text>
          </View>
        </View>

        {student.parentName ? (
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="people-outline" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Parent / Guardian</Text>
              <Text style={styles.infoValue}>
                {student.parentName} {student.parentPhone ? `(${student.parentPhone})` : ''}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <Ionicons name="cash-outline" size={16} color={COLORS.primary} />
          </View>
          <View style={styles.infoTextBox}>
            <Text style={styles.infoLabel}>Configured Monthly Fee</Text>
            <Text style={styles.infoValue}>₹{student.monthlyFee.toLocaleString()} / month</Text>
          </View>
        </View>
      </View>

      {/* Payment Ledger for This Student */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Payment History</Text>
        {MOCK_STUDENT_PAYMENTS.map((payment) => (
          <View key={payment.id} style={styles.historyRow}>
            <View>
              <Text style={styles.historyAmount}>+₹{payment.amount.toLocaleString()}</Text>
              <Text style={styles.historyDate}>
                {payment.paymentDate} • {payment.paymentMethod.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.historyRef}>{payment.transactionRef || 'Cash'}</Text>
          </View>
        ))}
      </View>

      {/* Deactivate / Archive Action */}
      <TouchableOpacity
        style={styles.deactivateBtn}
        onPress={() => setArchiveVisible(true)}
      >
        <Ionicons
          name={student.status === 'active' ? 'archive-outline' : 'refresh-outline'}
          size={16}
          color={student.status === 'active' ? COLORS.error : COLORS.primary}
        />
        <Text
          style={[
            styles.deactivateText,
            { color: student.status === 'active' ? COLORS.error : COLORS.primary },
          ]}
        >
          {student.status === 'active' ? 'Deactivate / Archive Student' : 'Reactivate Student'}
        </Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={archiveVisible}
        title={student.status === 'active' ? 'Deactivate Student' : 'Reactivate Student'}
        message={
          student.status === 'active'
            ? 'Deactivating this student preserves all payment records while stopping automated WhatsApp reminders.'
            : 'Reactivating this student will restore active billing cycles and reminder eligibility.'
        }
        confirmText={student.status === 'active' ? 'Deactivate' : 'Reactivate'}
        isDestructive={student.status === 'active'}
        onConfirm={handleDeactivate}
        onCancel={() => setArchiveVisible(false)}
      />
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
  profileHeaderCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  avatar: {
    width: 64,
    height: 64,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  profileMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  codeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 2,
  },
  editButton: {
    flex: 1,
  },
  billingCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  billingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  billingItem: {
    width: '46%',
  },
  billingLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  billingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  overdueDate: {
    color: COLORS.status.overdue,
  },
  overdueValue: {
    color: COLORS.status.overdue,
  },
  positiveValue: {
    color: COLORS.status.paid,
  },
  outstandingValue: {
    color: COLORS.status.due,
  },
  cycleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  cycleNoticeText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.primaryDark,
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextBox: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    marginTop: 4,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.status.paid,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyRef: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  deactivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  },
  deactivateText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
