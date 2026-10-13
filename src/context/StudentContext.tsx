import React, { createContext, useContext, useEffect, useState } from 'react';
import { CreateStudentInput, Student, StudentFeeStatus, UpdateStudentInput } from '../types/student';
import { addCalendarDays, getDaysRemaining, getTodayDateString } from '../utils/date';
import { StorageService } from '../utils/storage';
import { generateStudentCode } from '../utils/studentCode';

interface StudentContextType {
  students: Student[];
  loading: boolean;
  addStudent: (input: CreateStudentInput) => Promise<Student>;
  updateStudent: (id: string, input: UpdateStudentInput) => Promise<Student>;
  toggleStudentStatus: (id: string) => Promise<void>;
  getStudentById: (id: string) => Student | undefined;
  peekNextStudentCode: () => Promise<string>;
  refreshStudents: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

// Initial seed students for first launch
const INITIAL_SEED_STUDENTS: Student[] = [
  {
    id: 'stu-1',
    studentCode: 'STU-2026-0001',
    name: 'Aarav Sharma',
    phone: '9876543210',
    parentName: 'Ramesh Sharma',
    parentPhone: '9876543211',
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
    phone: '9876500001',
    parentName: 'Kirit Patel',
    parentPhone: '9876500002',
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
    phone: '9876500003',
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
    phone: '9876500004',
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

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Recalculates dynamically updated daysRemaining and status for each student
  const recalculateStudentStatus = (student: Student): Student => {
    const daysLeft = getDaysRemaining(student.nextDeadline);
    let feeStatus: StudentFeeStatus = student.feeStatus;

    if (student.outstandingAmount <= 0) {
      feeStatus = 'paid';
    } else if (daysLeft < 0) {
      feeStatus = 'overdue';
    } else if (daysLeft <= 3) {
      feeStatus = 'due';
    } else {
      feeStatus = 'partial';
    }

    return {
      ...student,
      daysRemaining: daysLeft,
      feeStatus,
    };
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      let stored = await StorageService.getStudents();
      if (!stored || stored.length === 0) {
        // Seed default initial students for first launch
        await StorageService.saveStudents(INITIAL_SEED_STUDENTS);
        stored = INITIAL_SEED_STUDENTS;
      }

      const updated = stored.map(recalculateStudentStatus);
      setStudents(updated);
    } catch (e) {
      console.error('Error loading students:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const peekNextStudentCode = async (): Promise<string> => {
    const seq = await StorageService.peekNextSequence();
    // Ensure sequence exceeds any existing student codes
    const existingMax = students.reduce((max, s) => {
      const parts = s.studentCode.split('-');
      const num = parts.length === 3 ? parseInt(parts[2], 10) : 0;
      return num > max ? num : max;
    }, 0);
    const targetSeq = Math.max(seq, existingMax + 1);
    return generateStudentCode(targetSeq);
  };

  const addStudent = async (input: CreateStudentInput): Promise<Student> => {
    const seq = await StorageService.getNextSequence();
    const existingMax = students.reduce((max, s) => {
      const parts = s.studentCode.split('-');
      const num = parts.length === 3 ? parseInt(parts[2], 10) : 0;
      return num > max ? num : max;
    }, 0);
    const nextSeq = Math.max(seq, existingMax + 1);
    const studentCode = generateStudentCode(nextSeq);

    const admissionDate = input.admissionDate || getTodayDateString();
    const nextDeadline = addCalendarDays(admissionDate, 30);
    const daysLeft = getDaysRemaining(nextDeadline);

    const newStudent: Student = {
      id: `stu-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      studentCode,
      name: input.name.trim(),
      phone: input.phone.trim(),
      parentName: input.parentName?.trim() || undefined,
      parentPhone: input.parentPhone?.trim() || undefined,
      monthlyFee: Number(input.monthlyFee),
      status: 'active',
      photoUrl: input.photoUrl,
      admissionDate,
      feeStatus: 'due',
      lastPaymentDate: undefined,
      nextDeadline,
      daysRemaining: daysLeft,
      outstandingAmount: Number(input.monthlyFee),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedList = [newStudent, ...students];
    setStudents(updatedList);
    await StorageService.saveStudents(updatedList);
    return newStudent;
  };

  const updateStudent = async (id: string, input: UpdateStudentInput): Promise<Student> => {
    let updatedRecord: Student | null = null;

    const updatedList = students.map((s) => {
      if (s.id !== id) return s;

      // Ensure studentCode, admissionDate, and billing cycle fields are preserved
      updatedRecord = {
        ...s,
        name: input.name !== undefined ? input.name.trim() : s.name,
        phone: input.phone !== undefined ? input.phone.trim() : s.phone,
        parentName: input.parentName !== undefined ? input.parentName.trim() : s.parentName,
        parentPhone: input.parentPhone !== undefined ? input.parentPhone.trim() : s.parentPhone,
        monthlyFee: input.monthlyFee !== undefined ? Number(input.monthlyFee) : s.monthlyFee,
        photoUrl: input.photoUrl !== undefined ? input.photoUrl : s.photoUrl,
        status: input.status !== undefined ? input.status : s.status,
        updatedAt: new Date().toISOString(),
      };
      return updatedRecord;
    });

    if (!updatedRecord) throw new Error('Student not found');

    setStudents(updatedList);
    await StorageService.saveStudents(updatedList);
    return updatedRecord;
  };

  const toggleStudentStatus = async (id: string): Promise<void> => {
    const updatedList = students.map((s) => {
      if (s.id !== id) return s;
      const newStatus = s.status === 'active' ? 'inactive' : 'active';
      return {
        ...s,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
    });

    setStudents(updatedList);
    await StorageService.saveStudents(updatedList);
  };

  const getStudentById = (id: string): Student | undefined => {
    return students.find((s) => s.id === id);
  };

  return (
    <StudentContext.Provider
      value={{
        students,
        loading,
        addStudent,
        updateStudent,
        toggleStudentStatus,
        getStudentById,
        peekNextStudentCode,
        refreshStudents: loadStudents,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudents = () => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudents must be used within a StudentProvider');
  }
  return context;
};
