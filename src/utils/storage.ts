import AsyncStorage from '@react-native-async-storage/async-storage';
import { Student } from '../types/student';

const STORAGE_KEYS = {
  STUDENTS: '@fee_manager_students_v1',
  STUDENT_SEQUENCE: '@fee_manager_student_sequence_v1',
};

const DEFAULT_MOCK_STUDENTS: Student[] = [
  {
    id: 'stu-ankur-test',
    studentCode: 'STU-2026-0001',
    name: 'Ankur (Admin Test)',
    phone: '8574117424',
    parentName: 'Guardian',
    parentPhone: '8574117424',
    monthlyFee: 3500,
    outstandingAmount: 3500,
    status: 'active',
    admissionDate: '2026-01-09',
    nextDeadline: '2026-02-09',
    daysRemaining: -31,
    feeStatus: 'overdue',
    createdAt: '2026-01-09T10:00:00Z',
    updatedAt: '2026-01-09T10:00:00Z',
  },
  {
    id: 'stu-diya-test',
    studentCode: 'STU-2026-0002',
    name: 'Diya Patel',
    phone: '9876500001',
    parentName: 'Suresh Patel',
    parentPhone: '9876500001',
    monthlyFee: 4000,
    outstandingAmount: 2000,
    status: 'active',
    admissionDate: '2026-01-12',
    nextDeadline: '2026-02-11',
    daysRemaining: -31,
    feeStatus: 'partial',
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-01-12T10:00:00Z',
  },
];

export const StorageService = {
  async getStudents(): Promise<Student[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (!data) {
        await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_MOCK_STUDENTS));
        return DEFAULT_MOCK_STUDENTS;
      }
      const parsed: Student[] = JSON.parse(data);
      // Ensure Ankur's test phone number 8574117424 is always present for testing
      if (!parsed.some((s) => s.phone.includes('8574117424'))) {
        const merged = [DEFAULT_MOCK_STUDENTS[0], ...parsed];
        await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    } catch {
      return DEFAULT_MOCK_STUDENTS;
    }
  },

  async saveStudents(students: Student[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error('Failed to save students to storage:', e);
    }
  },

  async getNextSequence(): Promise<number> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.STUDENT_SEQUENCE);
      const current = val ? parseInt(val, 10) : 0;
      const next = current + 1;
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENT_SEQUENCE, String(next));
      return next;
    } catch {
      return 1;
    }
  },

  async peekNextSequence(): Promise<number> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.STUDENT_SEQUENCE);
      const current = val ? parseInt(val, 10) : 0;
      return current + 1;
    } catch {
      return 1;
    }
  },
};
