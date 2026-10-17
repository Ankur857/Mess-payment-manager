import AsyncStorage from '@react-native-async-storage/async-storage';
import { Student } from '../types/student';

const STORAGE_KEYS = {
  STUDENTS: '@fee_manager_students_v1',
  STUDENT_SEQUENCE: '@fee_manager_student_sequence_v1',
};

export const StorageService = {
  async getStudents(): Promise<Student[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (!data) return [];
      const parsed: Student[] = JSON.parse(data);
      // Clean out any legacy seed or dummy entries
      const sanitized = parsed.filter(
        (s) => !s.id.includes('seed') && !s.id.includes('test') && !s.phone.includes('8574117424')
      );
      if (sanitized.length !== parsed.length) {
        await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(sanitized));
      }
      return sanitized;
    } catch {
      return [];
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
