import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { LoadingState } from '../../../components/common/LoadingState';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../../constants/theme';
import { usePayments } from '../../../context/PaymentContext';
import { useStudents } from '../../../context/StudentContext';
import { formatDisplayDate } from '../../../utils/date';

export default function StudentProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getStudentById, toggleStudentStatus, loading: studentLoading } = useStudents();
  const { getStudentPayments } = usePayments();
  const [archiveVisible, setArchiveVisible] = useState(false);

  const student = getStudentById(String(id));
  const studentPayments = student ? getStudentPayments(student.id) : [];

  if (studentLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (!student) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorTitle}>Student Not Found</Text>
        <Text style={styles.errorSubtitle}>
          The requested student ID does not match any registered records.
        </Text>
        <Button
          title="Back to Directory"
          onPress={() => router.back()}
          style={{ marginTop: SPACING.lg }}
        />
      </View>
    );
  }

  const latestPayment = studentPayments.length > 0 ? studentPayments[0] : null;
  const lastPaymentAmount = latestPayment
    ? latestPayment.amount
    : student.lastPaymentDate
    ? student.monthlyFee
    : null;
  const lastPaymentDate = latestPayment ? latestPayment.paymentDate : student.lastPaymentDate;
  const lastPaymentMethod = latestPayment ? latestPayment.paymentMethod : null;
  const lastPaymentRef = latestPayment ? latestPayment.transactionRef : null;

  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    if (cleanNumber) {
      Linking.openURL(`tel:${cleanNumber}`).catch(() => {
        Alert.alert('Error', 'Unable to initiate phone call on this device.');
      });
    }
  };

  const handleWhatsApp = (phoneNumber: string) => {
    const cleanDigits = phoneNumber.replace(/[^0-9]/g, '');
    const internationalNumber = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const url = `whatsapp://send?phone=${internationalNumber}`;
    Linking.openURL(url).catch(() => {
      // Fallback to web link
      Linking.openURL(`https://wa.me/${internationalNumber}`).catch(() => {
        Alert.alert('Error', 'Unable to open WhatsApp.');
      });
    });
  };

  const handleToggleStatus = async () => {
    try {
      await toggleStudentStatus(student.id);
      setArchiveVisible(false);
      Alert.alert(
        'Status Updated',
        student.status === 'active'
          ? 'Student has been deactivated. Automatic reminders are paused.'
          : 'Student has been reactivated.'
      );
    } catch {
      Alert.alert('Error', 'Failed to update student status.');
    }
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
                params: { id: student.id },
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
                params: { id: student.id },
              })
            }
            style={styles.editButton}
          />
        </View>
      </View>

      {/* Last Payment Highlights Card */}
      <View style={styles.lastPaymentCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="receipt" size={18} color={COLORS.status.paid} />
          </View>
          <Text style={styles.cardTitle}>Last Payment Record</Text>
        </View>

        {lastPaymentDate ? (
          <View style={styles.lastPaymentContent}>
            <View style={styles.lastPaymentHeroRow}>
              <View>
                <Text style={styles.lastPaymentLabel}>Last Paid Amount</Text>
                <Text style={styles.lastPaymentHeroAmount}>
                  ₹{(lastPaymentAmount ?? student.monthlyFee).toLocaleString()}
                </Text>
              </View>
              <View style={styles.lastPaymentDatePill}>
                <Ionicons name="checkmark-circle" size={15} color={COLORS.status.paid} />
                <Text style={styles.lastPaymentDateText}>
                  {formatDisplayDate(lastPaymentDate)}
                </Text>
              </View>
            </View>

            <View style={styles.lastPaymentMetaBar}>
              <View style={styles.lastPaymentMetaCol}>
                <Text style={styles.metaLabel}>Payment Mode</Text>
                <Text style={styles.metaVal}>
                  {lastPaymentMethod ? lastPaymentMethod.replace('_', ' ').toUpperCase() : 'DIRECT'}
                </Text>
              </View>
              <View style={styles.lastPaymentMetaCol}>
                <Text style={styles.metaLabel}>Reference / Receipt</Text>
                <Text style={styles.metaVal} numberOfLines={1}>
                  {lastPaymentRef || 'Direct Entry'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noPaymentNotice}>
            <Ionicons name="time-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.noPaymentNoticeText}>No payment has been recorded yet.</Text>
          </View>
        )}
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
            <Text style={styles.billingValue}>
              {lastPaymentDate ? formatDisplayDate(lastPaymentDate) : 'None Recorded'}
            </Text>
          </View>
          <View style={styles.billingItem}>
            <Text style={styles.billingLabel}>Next Deadline (+30 Days)</Text>
            <Text
              style={[
                styles.billingValue,
                student.feeStatus === 'overdue' ? styles.overdueDate : null,
              ]}
            >
              {formatDisplayDate(student.nextDeadline)}
            </Text>
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
            <Text style={styles.billingLabel}>Outstanding Balance</Text>
            <Text style={[styles.billingValue, styles.outstandingValue]}>
              ₹{student.outstandingAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.cycleNotice}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primaryDark} />
          <Text style={styles.cycleNoticeText}>
            Billing deadlines advance 30 days upon qualifying payments. Automated reminders trigger on Day 31 for overdue accounts.
          </Text>
        </View>
      </View>

      {/* Contact Details Card */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Contact Details</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <Ionicons name="call-outline" size={16} color={COLORS.primary} />
          </View>
          <View style={styles.infoTextBox}>
            <Text style={styles.infoLabel}>Student WhatsApp / Phone</Text>
            <Text style={styles.infoValue}>{student.phone}</Text>
          </View>
          <View style={styles.contactActionButtons}>
            <TouchableOpacity
              style={styles.contactIconBtn}
              onPress={() => handleCall(student.phone)}
            >
              <Ionicons name="call" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactIconBtn, styles.whatsappBtn]}
              onPress={() => handleWhatsApp(student.phone)}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            </TouchableOpacity>
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
            {student.parentPhone ? (
              <TouchableOpacity
                style={styles.contactIconBtn}
                onPress={() => handleCall(student.parentPhone!)}
              >
                <Ionicons name="call" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            ) : null}
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
        <View style={styles.cardHeader}>
          <Ionicons name="file-tray-full-outline" size={18} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Complete Payment Ledger</Text>
        </View>
        {studentPayments.length > 0 ? (
          studentPayments.map((payment) => (
            <View key={payment.id} style={styles.historyRow}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyAmount}>+₹{payment.amount.toLocaleString()}</Text>
                <Text style={styles.historyDate}>
                  {formatDisplayDate(payment.paymentDate)} • {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyRef}>{payment.transactionRef || 'Direct Receipt'}</Text>
                {payment.notes ? (
                  <Text style={styles.historyNotes} numberOfLines={1}>
                    {payment.notes}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noPaymentsText}>No payments recorded yet for this student.</Text>
        )}
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
            ? 'Deactivating preserves all payment history while pausing automated reminders.'
            : 'Reactivating restores active status and reminder eligibility.'
        }
        confirmText={student.status === 'active' ? 'Deactivate' : 'Reactivate'}
        isDestructive={student.status === 'active'}
        onConfirm={handleToggleStatus}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  errorSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
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
  lastPaymentCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.status.paid + '40',
    ...SHADOWS.card,
  },
  headerIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.status.paid + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastPaymentContent: {
    marginTop: 4,
  },
  lastPaymentHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  lastPaymentLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  lastPaymentHeroAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.status.paid,
    marginTop: 2,
  },
  lastPaymentDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.status.paid + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  lastPaymentDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.status.paid,
  },
  lastPaymentMetaBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  lastPaymentMetaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  noPaymentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: SPACING.sm,
  },
  noPaymentNoticeText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  contactActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contactIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  whatsappBtn: {
    backgroundColor: '#DCF8C6',
    borderColor: '#25D36640',
  },
  historyLeft: {
    flex: 1,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyNotes: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
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
  noPaymentsText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingVertical: SPACING.md,
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
