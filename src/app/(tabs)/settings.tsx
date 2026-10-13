import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [autoReminderEnabled, setAutoReminderEnabled] = useState(true);

  const handleLogout = () => {
    setLogoutVisible(false);
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Admin Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.adminName}>Super Admin</Text>
          <Text style={styles.adminEmail}>admin@feemanager.com</Text>
          <View style={styles.adminRoleBadge}>
            <Text style={styles.adminRoleText}>Full Access • Single Admin</Text>
          </View>
        </View>
      </View>

      {/* WhatsApp Automation Section */}
      <Text style={styles.sectionHeading}>WhatsApp Automation</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>Auto Reminders (Day 31)</Text>
            <Text style={styles.settingDescription}>
              Automatically trigger WhatsApp overdue notices via Edge Function
            </Text>
          </View>
          <Switch
            value={autoReminderEnabled}
            onValueChange={setAutoReminderEnabled}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.navRow}
          onPress={() => router.push('/settings/whatsapp-templates')}
          activeOpacity={0.7}
        >
          <View style={styles.navLeft}>
            <Ionicons name="chatbubbles-outline" size={20} color={COLORS.primary} />
            <View>
              <Text style={styles.settingTitle}>Message Templates</Text>
              <Text style={styles.settingDescription}>
                Configure approved WhatsApp Cloud API message variables
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Billing Policy Section */}
      <Text style={styles.sectionHeading}>Billing Engine Configuration</Text>
      <View style={styles.card}>
        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Billing Cycle Duration</Text>
          <Text style={styles.policyValue}>30 Calendar Days</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Overdue Reminder Trigger</Text>
          <Text style={styles.policyValue}>Day 31 at 09:00 AM</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.policyRow}>
          <Text style={styles.policyLabel}>Partial Payment Policy</Text>
          <Text style={styles.policyValue}>Retain Original Due Date</Text>
        </View>
      </View>

      {/* Account Security & Logout */}
      <Text style={styles.sectionHeading}>Session & Security</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.navRow}
          onPress={() => setLogoutVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.navLeft}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={[styles.settingTitle, { color: COLORS.error }]}>
              Log Out of Admin Portal
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* App Version Info */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Fee Manager App v1.0.0 (Expo SDK 57)</Text>
        <Text style={styles.versionSubtext}>Supabase PostgreSQL + WhatsApp Cloud API</Text>
      </View>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        visible={logoutVisible}
        title="Confirm Log Out"
        message="Are you sure you want to end your administrative session?"
        confirmText="Log Out"
        isDestructive
        onConfirm={handleLogout}
        onCancel={() => setLogoutVisible(false)}
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
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
  },
  profileInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  adminEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  adminRoleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginTop: 6,
  },
  adminRoleText: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  settingDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.sm,
  },
  policyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  policyLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  policyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  versionSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
