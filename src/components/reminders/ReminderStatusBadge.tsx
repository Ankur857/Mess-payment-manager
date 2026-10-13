import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { ReminderStatus } from '../../types/reminder';

interface ReminderStatusBadgeProps {
  status: ReminderStatus;
  isMock?: boolean;
}

export const ReminderStatusBadge: React.FC<ReminderStatusBadgeProps> = ({
  status,
  isMock = false,
}) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'sent':
        return {
          bg: COLORS.status.paidBg,
          text: COLORS.status.paid,
          border: COLORS.status.paidBorder,
          label: isMock ? 'Mock Sent' : 'Delivered',
        };
      case 'failed':
        return {
          bg: COLORS.status.overdueBg,
          text: COLORS.status.overdue,
          border: COLORS.status.overdueBorder,
          label: 'Failed',
        };
      case 'cancelled':
        return {
          bg: COLORS.status.inactiveBg,
          text: COLORS.status.inactive,
          border: COLORS.status.inactiveBorder,
          label: 'Cancelled',
        };
      case 'pending':
      default:
        return {
          bg: COLORS.status.dueBg,
          text: COLORS.status.due,
          border: COLORS.status.dueBorder,
          label: 'Scheduled',
        };
    }
  };

  const styleConfig = getBadgeStyle();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: styleConfig.bg,
          borderColor: styleConfig.border,
        },
      ]}
    >
      <Text style={[styles.text, { color: styleConfig.text }]}>
        {styleConfig.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
