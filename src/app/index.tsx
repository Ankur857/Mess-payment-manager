import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const LOGO_SIZE = Math.min(width * 0.65, 260);

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [minTimerDone, setMinTimerDone] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const pulseAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    // 1. Initial entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Continuous subtle pulse loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Minimum splash screen display duration (1200ms)
    const timer = setTimeout(() => {
      setMinTimerDone(true);
    }, 1200);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
    };
  }, []);

  // When both auth resolution & min splash duration are done, navigate smoothly
  useEffect(() => {
    if (!loading && minTimerDone) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [loading, minTimerDone, isAuthenticated, router]);

  const handleManualSkip = () => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Ambient background glow */}
      <View style={styles.ambientGlow} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Brand Logo with Glow Frame */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand Titles */}
        <View style={styles.titleContainer}>
          <Text style={styles.restaurantName}>RAGHUVANSHI</Text>
          <Text style={styles.restaurantSubName}>RESTORENT & CAFE</Text>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.diamondIcon}>◆</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.tagline}>GOOD TIME, GREAT TEST</Text>
          <Text style={styles.portalSubtitle}>FEE & MESS MANAGEMENT PORTAL</Text>
        </View>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#F59E0B" />
          <Text style={styles.loadingText}>Initializing portal...</Text>
        </View>

        {/* Touch to continue fallback */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleManualSkip}
          style={styles.skipButton}
        >
          <Text style={styles.skipButtonText}>Enter Portal →</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Authorized Single Admin System</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ambientGlow: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: '#D97706',
    opacity: 0.06,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
    textAlign: 'center',
  },
  restaurantSubName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    letterSpacing: 2.5,
    marginTop: 2,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    width: 140,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#B45309',
    opacity: 0.6,
  },
  diamondIcon: {
    color: '#F59E0B',
    fontSize: 10,
    marginHorizontal: 8,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FDE68A',
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  portalSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  loadingText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '500',
  },
  skipButton: {
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.8,
  },
});
