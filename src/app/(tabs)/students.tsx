import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState } from '../../components/common/EmptyState';
import { Input } from '../../components/common/Input';
import { LoadingState } from '../../components/common/LoadingState';
import { StudentCard } from '../../components/students/StudentCard';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { useStudents } from '../../context/StudentContext';
import { StudentFeeStatus } from '../../types/student';

type FilterType = 'all' | StudentFeeStatus;

export default function StudentsScreen() {
  const router = useRouter();
  const { students, loading, refreshStudents } = useStudents();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshStudents();
    setRefreshing(false);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((item) => {
      const query = search.toLowerCase();
      const matchSearch =
        item.name.toLowerCase().includes(query) ||
        item.phone.includes(query) ||
        item.studentCode.toLowerCase().includes(query);

      if (!matchSearch) return false;

      if (activeFilter === 'all') return true;
      return item.feeStatus === activeFilter;
    });
  }, [students, search, activeFilter]);

  const filterTabs: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Due Soon', value: 'due' },
    { label: 'Paid', value: 'paid' },
  ];

  if (loading && !refreshing) {
    return <LoadingState message="Loading student records..." />;
  }

  return (
    <View style={styles.container}>
      {/* Search Bar & Add Button */}
      <View style={styles.topBar}>
        <View style={styles.searchWrapper}>
          <Input
            placeholder="Search by name, phone, code..."
            value={search}
            onChangeText={setSearch}
            containerStyle={styles.searchInputContainer}
            leftIcon={<Ionicons name="search-outline" size={18} color={COLORS.textMuted} />}
          />
        </View>
        <TouchableOpacity
          style={styles.addStudentBtn}
          onPress={() => router.push('/students/add')}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[styles.filterChip, isActive ? styles.filterChipActive : null]}
                onPress={() => setActiveFilter(tab.value)}
              >
                <Text style={[styles.filterChipText, isActive ? styles.filterChipTextActive : null]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Student List */}
      <FlatList
        data={filteredStudents}
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
          <StudentCard
            student={item}
            onPress={() =>
              router.push({
                pathname: '/students/[id]',
                params: { id: item.id },
              })
            }
            onRecordPayment={() =>
              router.push({
                pathname: '/students/[id]/record-payment',
                params: { id: item.id },
              })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No Students Found"
            description={
              search
                ? `No student matching "${search}" was found.`
                : 'Get started by registering your first student record.'
            }
            actionText="Add New Student"
            onAction={() => router.push('/students/add')}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  searchWrapper: {
    flex: 1,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  addStudentBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    paddingVertical: SPACING.sm,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
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
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xxxl,
  },
});
