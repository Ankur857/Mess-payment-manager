import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { Payment } from '../../types/payment';
import { formatDisplayDate } from '../../utils/date';
import { Button } from '../common/Button';

interface ReceiptModalProps {
  visible: boolean;
  payment: Payment | null;
  studentName: string;
  studentCode: string;
  nextDeadline: string;
  remainingBalance: number;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  payment,
  studentName,
  studentCode,
  nextDeadline,
  remainingBalance,
  onClose,
}) => {
  if (!payment) return null;

  const handleShare = async () => {
    try {
      const message = `*FEE PAYMENT RECEIPT*\n` +
        `--------------------------\n` +
        `Student: ${studentName} (${studentCode})\n` +
        `Amount Paid: ₹${payment.amount.toLocaleString()}\n` +
        `Payment Date: ${formatDisplayDate(payment.paymentDate)}\n` +
        `Method: ${payment.paymentMethod.toUpperCase()}\n` +
        (payment.transactionRef ? `Ref No: ${payment.transactionRef}\n` : '') +
        `Remaining Balance: ₹${remainingBalance.toLocaleString()}\n` +
        `Next Deadline: ${formatDisplayDate(nextDeadline)}\n` +
        `--------------------------\n` +
        `Thank you for your payment!`;

      await Share.share({
        message,
        title: 'Fee Payment Receipt',
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Receipt Header Badge */}
              <View style={styles.header}>
                <View style={styles.checkCircle}>
                  <Ionicons name="checkmark" size={32} color={COLORS.white} />
                </View>
                <Text style={styles.title}>Payment Successful</Text>
                <Text style={styles.subtitle}>Official Fee Receipt</Text>
              </View>

              {/* Amount Display */}
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Amount Received</Text>
                <Text style={styles.amountValue}>₹{payment.amount.toLocaleString()}</Text>
              </View>

              {/* Receipt Details Table */}
              <View style={styles.detailsTable}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Student</Text>
                  <Text style={styles.detailValue}>{studentName}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Student Code</Text>
                  <Text style={styles.detailValue}>{studentCode}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Date</Text>
                  <Text style={styles.detailValue}>{formatDisplayDate(payment.paymentDate)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method</Text>
                  <Text style={styles.detailValue}>{payment.paymentMethod.replace('_', ' ').toUpperCase()}</Text>
                </View>

                {payment.transactionRef ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reference No.</Text>
                    <Text style={styles.detailValue}>{payment.transactionRef}</Text>
                  </View>
                ) : null}

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Remaining Balance</Text>
                  <Text style={[styles.detailValue, remainingBalance > 0 ? styles.balancePending : styles.balanceCleared]}>
                    ₹{remainingBalance.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Next Billing Deadline</Text>
                  <Text style={[styles.detailValue, { color: COLORS.primaryDark, fontWeight: '700' }]}>
                    {formatDisplayDate(nextDeadline)}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.8}>
                  <Ionicons name="share-social-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.shareText}>Share</Text>
                </TouchableOpacity>

                <Button
                  title="Done"
                  onPress={onClose}
                  style={styles.doneButton}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.cardElevated,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  checkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  amountBox: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  amountLabel: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  detailsTable: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.xs + 2,
  },
  balancePending: {
    color: COLORS.status.due,
    fontWeight: '700',
  },
  balanceCleared: {
    color: COLORS.status.paid,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  doneButton: {
    flex: 1.5,
  },
});
