import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { StudentFeeStatus } from '../../types/student';

interface BadgeProps {
  status: StudentFeeStatus | 'active' | 'inactive';
  label?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({ status, label, style, textStyle }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'paid':
        return {
          bg: COLORS.status.paidBg,
          color: COLORS.status.paid,
          border: COLORS.status.paidBorder,
          defaultLabel: 'Paid',
        };
      case 'due':
        return {
          bg: COLORS.status.dueBg,
          color: COLORS.status.due,
          border: COLORS.status.dueBorder,
          defaultLabel: 'Due Soon',
        };
      case 'overdue':
        return {
          bg: COLORS.status.overdueBg,
          color: COLORS.status.overdue,
          border: COLORS.status.overdueBorder,
          defaultLabel: 'Overdue',
        };
      case 'partial':
        return {
          bg: COLORS.status.partialBg,
          color: COLORS.status.partial,
          border: COLORS.status.partialBorder,
          defaultLabel: 'Partial',
        };
      case 'active':
        return {
          bg: COLORS.primaryLight,
          color: COLORS.primary,
          border: COLORS.primaryBorder,
          defaultLabel: 'Active',
        };
      case 'inactive':
      default:
        return {
          bg: COLORS.status.inactiveBg,
          color: COLORS.status.inactive,
          border: COLORS.status.inactiveBorder,
          defaultLabel: 'Inactive',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }, textStyle]}>
        {label || config.defaultLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
