import React, { createContext, useContext, useEffect, useState } from 'react';
import { StudentService } from '../services/studentService';
import { CreateStudentInput, Student, StudentFeeStatus, StudentStatus, UpdateStudentInput } from '../types/student';
import { getDaysRemaining } from '../utils/date';
import { StorageService } from '../utils/storage';
import { generateStudentCode } from '../utils/studentCode';

interface StudentContextType {
  students: Student[];
  loading: boolean;
  addStudent: (input: CreateStudentInput) => Promise<Student>;
  updateStudent: (id: string, input: UpdateStudentInput) => Promise<Student>;
  deleteStudent: (id: string) => Promise<void>;
  toggleStudentStatus: (id: string) => Promise<void>;
  getStudentById: (id: string) => Student | undefined;
  peekNextStudentCode: () => Promise<string>;
  refreshStudents: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const recalculateStudentStatus = (student: Student): Student => {
    const daysLeft = getDaysRemaining(student.nextDeadline);
    const isPaid = student.feeStatus === 'paid' || student.outstandingAmount <= 0;

    if (isPaid) {
      if (daysLeft >= 0) {
        // Paid cycle is still active: remain strictly 'paid' with 0 outstanding
        return {
          ...student,
          daysRemaining: daysLeft,
          outstandingAmount: 0,
          feeStatus: 'paid',
        };
      } else {
        // Full 30 days have elapsed: cycle expired, now overdue
        return {
          ...student,
          daysRemaining: daysLeft,
          feeStatus: 'overdue',
          outstandingAmount: student.monthlyFee,
        };
      }
    }

    // Unpaid or partially paid student
    let feeStatus: StudentFeeStatus;
    if (daysLeft < 0) {
      feeStatus = 'overdue';
    } else if (daysLeft <= 3) {
      feeStatus = 'due';
    } else if (student.outstandingAmount > 0 && student.outstandingAmount < student.monthlyFee) {
      feeStatus = 'partial';
    } else {
      feeStatus = 'due';
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
      const fetched = await StudentService.fetchStudents();
      const updated = fetched.map(recalculateStudentStatus);
      setStudents(updated);
      await StorageService.saveStudents(updated);
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

    // Upload photo to Supabase Storage if present
    let remotePhotoUrl = input.photoUrl;
    if (input.photoUrl) {
      const uploaded = await StudentService.uploadPhoto(input.photoUrl, studentCode);
      if (uploaded) remotePhotoUrl = uploaded;
    }

    const newStudent = await StudentService.createStudent(
      { ...input, photoUrl: remotePhotoUrl },
      studentCode
    );

    const updatedList = [newStudent, ...students];
    setStudents(updatedList);
    await StorageService.saveStudents(updatedList);
    return newStudent;
  };

  const updateStudent = async (id: string, input: UpdateStudentInput): Promise<Student> => {
    let updatedRecord: Student | null = null;

    // Upload photo to Supabase Storage if changed
    let remotePhotoUrl = input.photoUrl;
    const existing = students.find((s) => s.id === id);
    if (input.photoUrl && input.photoUrl !== existing?.photoUrl && existing) {
      const uploaded = await StudentService.uploadPhoto(input.photoUrl, existing.studentCode);
      if (uploaded) remotePhotoUrl = uploaded;
    }

    const payload = { ...input, photoUrl: remotePhotoUrl };
    await StudentService.updateStudent(id, payload);

    const updatedList = students.map((s) => {
      if (s.id !== id) return s;

      updatedRecord = {
        ...s,
        name: payload.name !== undefined ? payload.name.trim() : s.name,
        phone: payload.phone !== undefined ? payload.phone.trim() : s.phone,
        parentName: payload.parentName !== undefined ? payload.parentName.trim() : s.parentName,
        parentPhone: payload.parentPhone !== undefined ? payload.parentPhone.trim() : s.parentPhone,
        monthlyFee: payload.monthlyFee !== undefined ? Number(payload.monthlyFee) : s.monthlyFee,
        photoUrl: payload.photoUrl !== undefined ? payload.photoUrl : s.photoUrl,
        lastPaymentDate: payload.lastPaymentDate !== undefined ? payload.lastPaymentDate : s.lastPaymentDate,
        nextDeadline: payload.nextDeadline !== undefined ? payload.nextDeadline : s.nextDeadline,
        outstandingAmount: payload.outstandingAmount !== undefined ? payload.outstandingAmount : s.outstandingAmount,
        feeStatus: payload.feeStatus !== undefined ? payload.feeStatus : s.feeStatus,
        daysRemaining: payload.nextDeadline !== undefined ? getDaysRemaining(payload.nextDeadline) : s.daysRemaining,
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
    let targetStudent = students.find((s) => s.id === id);
    if (!targetStudent) return;

    const newStatus: StudentStatus = targetStudent.status === 'active' ? 'inactive' : 'active';
    await StudentService.updateStudent(id, { status: newStatus });

    const updatedList = students.map((s) => {
      if (s.id !== id) return s;
      return {
        ...s,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
    });

    setStudents(updatedList);
    await StorageService.saveStudents(updatedList);
  };

  const deleteStudent = async (id: string): Promise<void> => {
    // 1. Permanently remove from Supabase database if configured
    await StudentService.deleteStudent(id);

    // 2. Permanently remove from local state
    const remaining = students.filter((s) => s.id !== id);
    setStudents(remaining);

    // 3. Persist permanently to local storage
    await StorageService.saveStudents(remaining);
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
        deleteStudent,
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
