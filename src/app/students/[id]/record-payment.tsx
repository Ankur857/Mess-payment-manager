import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../../constants/theme';
import { PaymentMethod } from '../../../types/payment';

export default function RecordPaymentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Student details
  const studentName = 'Aarav Sharma';
  const studentCode = 'STU-2026-0001';
  const standardFee = 3500;
  const currentOutstanding = 3500;

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = useState(String(standardFee));
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate 30-day deadline preview
  const calculateDeadline = (baseDateStr: string) => {
    try {
      const d = new Date(baseDateStr + 'T12:00:00Z');
      d.setDate(d.getDate() + 30);
      return d.toISOString().split('T')[0];
    } catch {
      return 'Invalid date';
    }
  };

  const nextDeadlinePreview = calculateDeadline(paymentDate);

  const paymentMethods: { label: string; value: PaymentMethod; icon: keyof typeof Ionicons.glyphMap }[] = [
    { label: 'UPI / QR', value: 'upi', icon: 'qr-code-outline' },
    { label: 'Cash', value: 'cash', icon: 'cash-outline' },
    { label: 'Bank Transfer', value: 'bank_transfer', icon: 'business-outline' },
    { label: 'Other', value: 'other', icon: 'card-outline' },
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    const amtNum = Number(amount);

    if (!amount.trim()) {
      errs.amount = 'Amount is required';
    } else if (isNaN(amtNum) || amtNum <= 0) {
      errs.amount = 'Enter a valid positive payment amount';
    }

    if (!paymentDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
      errs.paymentDate = 'Enter valid date in YYYY-MM-DD format';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSavePayment = () => {
    if (!validate()) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Payment Recorded! 🎉',
        `₹${Number(amount).toLocaleString()} collected on ${paymentDate}.\nNext billing deadline: ${nextDeadlinePreview}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }, 600);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Student Summary Banner */}
        <View style={styles.studentBanner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.studentName}>{studentName}</Text>
            <Text style={styles.studentCode}>{studentCode}</Text>
          </View>
          <View style={styles.bannerRight}>
            <Text style={styles.outstandingLabel}>Outstanding</Text>
            <Text style={styles.outstandingAmount}>₹{currentOutstanding.toLocaleString()}</Text>
          </View>
        </View>

        {/* 30-Day Billing Cycle Indicator */}
        <View style={styles.ruleBanner}>
          <Ionicons name="sparkles" size={18} color={COLORS.primary} />
          <View style={styles.ruleTextContainer}>
            <Text style={styles.ruleTitle}>30-Day Billing Rule</Text>
            <Text style={styles.ruleSubtext}>
              Recording payment today sets the next deadline to {nextDeadlinePreview} (+30 days). Overdue notice sends Day 31.
            </Text>
          </View>
        </View>

        {/* Payment Form Card */}
        <View style={styles.formCard}>
          {/* Amount Input with Quick Preset Buttons */}
          <Input
            label="Payment Amount (₹) *"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            error={errors.amount}
            leftIcon={<Ionicons name="cash-outline" size={18} color={COLORS.textSecondary} />}
          />

          <View style={styles.quickPillRow}>
            <TouchableOpacity
              style={styles.quickPill}
              onPress={() => setAmount(String(standardFee))}
            >
              <Text style={styles.quickPillText}>Full Fee (₹{standardFee})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickPill}
              onPress={() => setAmount(String(Math.round(standardFee / 2)))}
            >
              <Text style={styles.quickPillText}>Half Fee (₹{Math.round(standardFee / 2)})</Text>
            </TouchableOpacity>
          </View>

          {/* Payment Date */}
          <Input
            label="Payment Date (YYYY-MM-DD) *"
            value={paymentDate}
            onChangeText={setPaymentDate}
            error={errors.paymentDate}
            helperText="Cycle starts from this date"
            leftIcon={<Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />}
          />

          {/* Payment Method Selector */}
          <Text style={styles.fieldLabel}>Payment Method *</Text>
          <View style={styles.methodGrid}>
            {paymentMethods.map((m) => {
              const isSelected = paymentMethod === m.value;
              return (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.methodCard, isSelected ? styles.methodCardActive : null]}
                  onPress={() => setPaymentMethod(m.value)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={m.icon}
                    size={20}
                    color={isSelected ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[styles.methodLabel, isSelected ? styles.methodLabelActive : null]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Transaction Reference & Notes */}
          <Input
            label="Transaction Reference / UPI ID (Optional)"
            placeholder="e.g. UPI/6044192834"
            value={transactionRef}
            onChangeText={setTransactionRef}
            leftIcon={<Ionicons name="receipt-outline" size={18} color={COLORS.textSecondary} />}
          />

          <Input
            label="Notes / Remarks (Optional)"
            placeholder="e.g. Paid in cash at tuition reception"
            value={notes}
            onChangeText={setNotes}
            leftIcon={<Ionicons name="document-text-outline" size={18} color={COLORS.textSecondary} />}
          />

          <Button
            title="Confirm & Save Payment"
            onPress={handleSavePayment}
            loading={loading}
            style={styles.saveBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  studentBanner: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  bannerLeft: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  studentCode: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  bannerRight: {
    alignItems: 'flex-end',
  },
  outstandingLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  outstandingAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.status.overdue,
    marginTop: 1,
  },
  ruleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  ruleTextContainer: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  ruleSubtext: {
    fontSize: 11,
    color: COLORS.primaryDark,
    marginTop: 2,
    lineHeight: 15,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  quickPillRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.md,
  },
  quickPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs + 2,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  methodCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  methodCardActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  methodLabelActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  saveBtn: {
    marginTop: SPACING.md,
  },
});
