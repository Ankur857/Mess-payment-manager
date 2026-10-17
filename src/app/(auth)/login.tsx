import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

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

    const result = await signIn(email.trim(), password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@feemanager.com');
    setPassword('admin123');
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          {/* Logo Badge */}
          <View style={styles.logoFrame}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Restaurant Brand Titles */}
          <Text style={styles.brandTitle}>RAGHUVANSHI</Text>
          <Text style={styles.brandSubtitle}>RESTORENT & CAFE</Text>

          {/* Tagline Banner */}
          <View style={styles.taglineBadge}>
            <View style={styles.taglineLine} />
            <Text style={styles.taglineText}>✦ GOOD TIME, GREAT TEST ✦</Text>
            <View style={styles.taglineLine} />
          </View>

          <Text style={styles.portalTag}>Mess & Fee Management Portal</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Admin Sign In</Text>
            <Text style={styles.cardDescription}>
              Authorized manager access for student records and fee ledger.
            </Text>
          </View>

          {/* Quick Admin Helper Banner */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleQuickFill}
            style={styles.mockBanner}
          >
            <View style={styles.mockBannerIcon}>
              <Ionicons name="key" size={16} color="#D97706" />
            </View>
            <View style={styles.mockBannerContent}>
              <Text style={styles.mockBannerTitle}>Default Admin Credentials</Text>
              <Text style={styles.mockBannerText}>
                admin@feemanager.com • admin123
              </Text>
            </View>
            <View style={styles.fillChip}>
              <Text style={styles.fillChipText}>Tap to Fill</Text>
            </View>
          </TouchableOpacity>

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
            title="Sign In to Portal"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <View style={styles.badgeInfo}>
            <Ionicons name="shield-checkmark" size={14} color="#D97706" />
            <Text style={styles.badgeInfoText}>
              Raghuvanshi Restorent & Cafe • Single Admin System
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
    backgroundColor: '#0A0D0A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoFrame: {
    width: 130,
    height: 130,
    borderRadius: 24,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 2,
    marginTop: 2,
    textAlign: 'center',
  },
  taglineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 8,
  },
  taglineLine: {
    width: 24,
    height: 1,
    backgroundColor: '#B45309',
  },
  taglineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FDE68A',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  portalTag: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.cardElevated,
  },
  cardHeader: {
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  mockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFBEB',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  mockBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockBannerContent: {
    flex: 1,
  },
  mockBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  mockBannerText: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  fillChip: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fillChipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
    backgroundColor: '#107C41',
  },
  badgeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  badgeInfoText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
});
