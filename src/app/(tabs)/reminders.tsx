import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingState } from '../../components/common/LoadingState';
import { ReminderTimelineCard } from '../../components/reminders/ReminderTimelineCard';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { useReminders } from '../../context/ReminderContext';
import { useStudents } from '../../context/StudentContext';
import { ReminderStatus } from '../../types/reminder';

type FilterTab = 'all' | ReminderStatus;

export default function RemindersScreen() {
  const { students } = useStudents();
  const {
    reminders,
    loading,
    scanAndGenerateDay31Reminders,
    sendReminder,
    retryReminder,
    cancelReminder,
    refreshReminders,
  } = useReminders();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshReminders();
    setRefreshing(false);
  };

  const handleScanDay31 = async () => {
    setScanning(true);
    try {
      const generated = await scanAndGenerateDay31Reminders(students);
      setScanning(false);
      if (generated > 0) {
        Alert.alert(
          'Scheduler Finished 🚀',
          `Generated ${generated} new overdue reminder(s) for Day 31 accounts with outstanding balances.`
        );
      } else {
        Alert.alert(
          'Up to Date ✅',
          'No new Day 31 overdue reminders needed. All eligible accounts already have scheduled or sent notices.'
        );
      }
    } catch {
      setScanning(false);
      Alert.alert('Error', 'Failed to scan overdue accounts.');
    }
  };

  const handleSendNow = async (id: string, studentName: string) => {
    const success = await sendReminder(id);
    if (success) {
      Alert.alert('Dispatched 📲', `WhatsApp reminder successfully sent to ${studentName}!`);
    } else {
      Alert.alert('Delivery Failed', 'Unable to dispatch WhatsApp reminder. Check phone number format.');
    }
  };

  const handleRetry = async (id: string) => {
    const success = await retryReminder(id);
    if (success) {
      Alert.alert('Retried 📲', 'WhatsApp reminder re-sent successfully!');
    } else {
      Alert.alert('Retry Failed', 'Retry limit reached or phone number invalid.');
    }
  };

  const handleCancel = async (id: string) => {
    await cancelReminder(id);
  };

  const filteredList = reminders.filter((rem) => {
    if (activeTab === 'all') return true;
    return rem.status === activeTab;
  });

  const tabs: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'all' },
    { label: 'Upcoming', value: 'pending' },
    { label: 'Sent', value: 'sent' },
    { label: 'Failed', value: 'failed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  if (loading && !refreshing) {
    return <LoadingState message="Loading reminder timeline..." />;
  }

  return (
    <View style={styles.container}>
      {/* Notice Banner with Scan Action */}
      <View style={styles.noticeCard}>
        <View style={styles.noticeLeft}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.noticeText}>
            Automated WhatsApp notices trigger on Day 31 for accounts with an outstanding balance.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={handleScanDay31}
          disabled={scanning}
          activeOpacity={0.8}
        >
          <Ionicons name="scan-outline" size={14} color={COLORS.white} />
          <Text style={styles.scanBtnText}>{scanning ? 'Scanning...' : 'Scan Day 31'}</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              style={[styles.tabChip, isActive ? styles.tabChipActive : null]}
              onPress={() => setActiveTab(tab.value)}
            >
              <Text style={[styles.tabText, isActive ? styles.tabTextActive : null]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Reminder List */}
      <FlatList
        data={filteredList}
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
          <ReminderTimelineCard
            reminder={item}
            onSendNow={() => handleSendNow(item.id, item.studentName)}
            onRetry={() => handleRetry(item.id)}
            onCancel={() => handleCancel(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No Reminders Found"
            description="No reminder logs match the current tab filter."
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
  noticeCard: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    gap: SPACING.sm,
  },
  noticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.primaryDark,
    lineHeight: 17,
    fontWeight: '500',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  scanBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  tabChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
});
