import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { usePayments } from '../../context/PaymentContext';
import { formatDisplayDate } from '../../utils/date';

export default function PaymentsScreen() {
  const { payments, loading, refreshPayments } = usePayments();
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshPayments();
    setRefreshing(false);
  };

  const filteredPayments = payments.filter((pay) => {
    if (selectedMethod === 'all') return true;
    return pay.paymentMethod === selectedMethod;
  });

  const totalAmount = filteredPayments.reduce((acc, p) => acc + p.amount, 0);

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'upi':
        return 'qr-code-outline';
      case 'cash':
        return 'cash-outline';
      case 'bank_transfer':
        return 'business-outline';
      default:
        return 'card-outline';
    }
  };

  if (loading && !refreshing) {
    return <LoadingState message="Loading payment ledger..." />;
  }

  return (
    <View style={styles.container}>
      {/* Ledger Summary Header */}
      <View style={styles.summaryBar}>
        <View>
          <Text style={styles.summaryLabel}>Total Collected in Ledger</Text>
          <Text style={styles.summaryAmount}>₹{totalAmount.toLocaleString()}</Text>
        </View>
        <View style={styles.recordBadge}>
          <Text style={styles.recordBadgeText}>{filteredPayments.length} Transactions</Text>
        </View>
      </View>

      {/* Payment Method Filter Pills */}
      <View style={styles.filterRow}>
        {['all', 'upi', 'cash', 'bank_transfer'].map((method) => {
          const isActive = selectedMethod === method;
          const label =
            method === 'all'
              ? 'All'
              : method === 'upi'
              ? 'UPI'
              : method === 'cash'
              ? 'Cash'
              : 'Bank';
          return (
            <TouchableOpacity
              key={method}
              style={[styles.filterChip, isActive ? styles.filterChipActive : null]}
              onPress={() => setSelectedMethod(method)}
            >
              <Text style={[styles.filterChipText, isActive ? styles.filterChipTextActive : null]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Ledger List */}
      <FlatList
        data={filteredPayments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.paymentCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{item.studentName || 'Student Payment'}</Text>
                <Text style={styles.studentCode}>{item.studentCode || ''}</Text>
              </View>
              <Text style={styles.amount}>+₹{item.amount.toLocaleString()}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardBottomRow}>
              <View style={styles.methodBadge}>
                <Ionicons
                  name={getMethodIcon(item.paymentMethod) as any}
                  size={14}
                  color={COLORS.primary}
                />
                <Text style={styles.methodText}>{item.paymentMethod.replace('_', ' ').toUpperCase()}</Text>
              </View>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.dateText}>{formatDisplayDate(item.paymentDate)}</Text>
              </View>
            </View>

            {item.transactionRef ? (
              <Text style={styles.refText}>Ref: {item.transactionRef}</Text>
            ) : null}
            {item.notes ? (
              <Text style={styles.notesText}>Note: {item.notes}</Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No Payment Records"
            description="No transactions match the selected payment method filter."
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
  summaryBar: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  recordBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  recordBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  paymentCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  studentCode: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.status.paid,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.sm,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  methodText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  refText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  notesText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
