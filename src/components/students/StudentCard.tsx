import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { Student } from '../../types/student';
import { Badge } from '../common/Badge';

interface StudentCardProps {
  student: Student;
  onPress: () => void;
  onRecordPayment?: () => void;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onPress,
  onRecordPayment,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          {student.photoUrl && !imageError ? (
            <Image
              source={{ uri: student.photoUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {student.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {student.name}
            </Text>
            <Badge status={student.feeStatus} />
          </View>
          <Text style={styles.codeText}>{student.studentCode}</Text>
          <View style={styles.phoneRow}>
            <Ionicons name="call-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.phoneText}>{student.phone}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.feeInfo}>
          <Text style={styles.feeLabel}>Monthly Fee</Text>
          <Text style={styles.feeValue}>₹{student.monthlyFee.toLocaleString()}</Text>
        </View>

        <View style={styles.deadlineInfo}>
          <Text style={styles.deadlineLabel}>
            {student.feeStatus === 'overdue'
              ? 'Overdue Since'
              : student.feeStatus === 'paid' && student.lastPaymentDate
              ? 'Last Paid'
              : 'Next Due'}
          </Text>
          <Text
            style={[
              styles.deadlineValue,
              student.feeStatus === 'overdue' ? styles.deadlineOverdue : null,
              student.feeStatus === 'paid' ? styles.deadlinePaid : null,
            ]}
          >
            {student.feeStatus === 'paid' && student.lastPaymentDate
              ? student.lastPaymentDate
              : student.nextDeadline || 'N/A'}
          </Text>
        </View>

        {onRecordPayment ? (
          <TouchableOpacity
            style={[
              styles.payButton,
              student.feeStatus === 'paid' ? styles.paidButton : null,
            ]}
            onPress={onRecordPayment}
            activeOpacity={0.7}
          >
            <Ionicons
              name={student.feeStatus === 'paid' ? 'checkmark-circle' : 'card-outline'}
              size={15}
              color={COLORS.white}
            />
            <Text style={styles.payButtonText}>
              {student.feeStatus === 'paid' ? 'Paid' : 'Pay'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: SPACING.xs,
  },
  codeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 3,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.sm + 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeInfo: {
    flex: 1,
  },
  feeLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  deadlineInfo: {
    flex: 1.2,
  },
  deadlineLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  deadlineValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  deadlineOverdue: {
    color: COLORS.status.overdue,
    fontWeight: '700',
  },
  deadlinePaid: {
    color: COLORS.status.paid,
    fontWeight: '700',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  paidButton: {
    backgroundColor: COLORS.status.paid,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
