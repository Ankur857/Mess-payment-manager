import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import { StudentProvider } from '../context/StudentContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StudentProvider>
        <StatusBar style="light" />
        <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.header,
          },
          headerTintColor: COLORS.headerText,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: COLORS.background,
          },
        }}
      >
        {/* Main Tab Navigator */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        {/* Auth Group */}
        <Stack.Screen
          name="(auth)/login"
          options={{
            headerShown: false,
          }}
        />

        {/* Student Modals/Stack Screens */}
        <Stack.Screen
          name="students/add"
          options={{
            title: 'Add New Student',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="students/[id]/index"
          options={{
            title: 'Student Profile',
          }}
        />
        <Stack.Screen
          name="students/[id]/edit"
          options={{
            title: 'Edit Student',
          }}
        />
        <Stack.Screen
          name="students/[id]/record-payment"
          options={{
            title: 'Record Payment',
          }}
        />

        {/* WhatsApp Template Settings */}
        <Stack.Screen
          name="settings/whatsapp-templates"
          options={{
            title: 'WhatsApp Message Templates',
          }}
        />
      </Stack>
      </StudentProvider>
    </SafeAreaProvider>
  );
}
