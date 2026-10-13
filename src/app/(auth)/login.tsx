import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both admin email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Phase 1 navigation placeholder - will connect to Supabase Auth in Phase 3
      setTimeout(() => {
        setLoading(false);
        router.replace('/(tabs)');
      }, 600);
    } catch {
      setLoading(false);
      setError('Login failed. Please check credentials.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={44} color={COLORS.primary} />
          </View>
          <Text style={styles.brandTitle}>Fee Manager</Text>
          <Text style={styles.brandSubtitle}>Single Admin Portal</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Admin Sign In</Text>
          <Text style={styles.cardDescription}>
            Enter your authorized credentials to access student records and fee ledger.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email Address"
            placeholder="admin@feemanager.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} />}
          />

          <Button
            title="Sign In as Admin"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <View style={styles.badgeInfo}>
            <Ionicons name="lock-closed" size={14} color={COLORS.primary} />
            <Text style={styles.badgeInfoText}>
              Protected by Supabase Row Level Security
            </Text>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.header,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.cardElevated,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.errorLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  loginButton: {
    marginTop: SPACING.sm,
  },
  badgeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  badgeInfoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
