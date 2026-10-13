import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EmptyState } from '../../components/common/EmptyState';
import { Input } from '../../components/common/Input';
import { StudentCard } from '../../components/students/StudentCard';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { Student, StudentFeeStatus } from '../../types/student';

// Phase 1 sample directory data
const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stu-1',
    studentCode: 'STU-2026-0001',
    name: 'Aarav Sharma',
    phone: '+919876543210',
    parentName: 'Ramesh Sharma',
    parentPhone: '+919876543211',
    monthlyFee: 3500,
    status: 'active',
    admissionDate: '2026-01-10',
    feeStatus: 'overdue',
    lastPaymentDate: '2026-01-10',
    nextDeadline: '2026-02-09',
    daysRemaining: -4,
    outstandingAmount: 3500,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-02-09T10:00:00Z',
  },
  {
    id: 'stu-2',
    studentCode: 'STU-2026-0002',
    name: 'Diya Patel',
    phone: '+919876500001',
    parentName: 'Kirit Patel',
    parentPhone: '+919876500002',
    monthlyFee: 4000,
    status: 'active',
    admissionDate: '2026-01-12',
    feeStatus: 'overdue',
    lastPaymentDate: '2026-01-12',
    nextDeadline: '2026-02-11',
    daysRemaining: -2,
    outstandingAmount: 4000,
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-02-11T10:00:00Z',
  },
  {
    id: 'stu-3',
    studentCode: 'STU-2026-0003',
    name: 'Vihaan Verma',
    phone: '+919876500003',
    monthlyFee: 3500,
    status: 'active',
    admissionDate: '2026-01-14',
    feeStatus: 'paid',
    lastPaymentDate: '2026-02-13',
    nextDeadline: '2026-03-15',
    daysRemaining: 28,
    outstandingAmount: 0,
    createdAt: '2026-01-14T10:00:00Z',
    updatedAt: '2026-02-13T10:00:00Z',
  },
  {
    id: 'stu-4',
    studentCode: 'STU-2026-0004',
    name: 'Ananya Iyer',
    phone: '+919876500004',
    monthlyFee: 4500,
    status: 'active',
    admissionDate: '2026-01-15',
    feeStatus: 'due',
    lastPaymentDate: '2026-01-15',
    nextDeadline: '2026-02-14',
    daysRemaining: 1,
    outstandingAmount: 4500,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-12T10:00:00Z',
  },
];

type FilterType = 'all' | StudentFeeStatus | 'inactive';

export default function StudentsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredStudents = useMemo(() => {
    return INITIAL_STUDENTS.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.phone.includes(search) ||
        item.studentCode.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (activeFilter === 'all') return true;
      if (activeFilter === 'inactive') return item.status === 'inactive';
      return item.feeStatus === activeFilter;
    });
  }, [search, activeFilter]);

  const filterTabs: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Due Soon', value: 'due' },
    { label: 'Paid', value: 'paid' },
    { label: 'Inactive', value: 'inactive' },
  ];

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
        renderItem={({ item }) => (
          <StudentCard
            student={item}
            onPress={() =>
              router.push({
                pathname: '/students/[id]/index',
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
