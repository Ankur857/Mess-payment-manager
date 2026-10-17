import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { CreateStudentInput, Student, UpdateStudentInput } from '../types/student';
import { addCalendarDays, getDaysRemaining, getTodayDateString } from '../utils/date';
import { StorageService } from '../utils/storage';

function decodeBase64ToArrayBuffer(base64: string): ArrayBuffer {
  if (typeof globalThis.atob === 'function') {
    const binStr = globalThis.atob(base64);
    const len = binStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return bytes.buffer;
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  let bufferLength = base64.length * 0.75;
  const len = base64.length;
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return bytes.buffer;
}

export const StudentService = {
  /**
   * Fetches all students from Supabase (or local storage if not configured)
   * Cross-references with local cache and recorded payments so lastPaymentDate and feeStatus remain 100% stable on refresh
   */
  async fetchStudents(): Promise<Student[]> {
    const localStudents = await StorageService.getStudents();
    let baseStudents: Student[] = localStudents;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          baseStudents = data.map((row) => {
            const localMatch = localStudents.find(
              (ls) => ls.id === row.id || ls.studentCode === row.student_code
            );
            const admissionDate = row.admission_date || localMatch?.admissionDate || getTodayDateString();
            const nextDeadline = localMatch?.nextDeadline || addCalendarDays(admissionDate, 30);
            const daysLeft = getDaysRemaining(nextDeadline);

            return {
              id: row.id,
              studentCode: row.student_code,
              name: row.name,
              phone: row.phone,
              parentName: row.parent_name || localMatch?.parentName || undefined,
              parentPhone: row.parent_phone || localMatch?.parentPhone || undefined,
              monthlyFee: Number(row.monthly_fee),
              status: row.status,
              photoUrl: row.photo_url || localMatch?.photoUrl || undefined,
              admissionDate,
              feeStatus: localMatch?.feeStatus || (daysLeft < 0 ? 'overdue' : 'due'),
              lastPaymentDate: localMatch?.lastPaymentDate,
              nextDeadline,
              daysRemaining: daysLeft,
              outstandingAmount:
                localMatch?.outstandingAmount !== undefined
                  ? localMatch.outstandingAmount
                  : Number(row.monthly_fee),
              createdAt: row.created_at || localMatch?.createdAt || new Date().toISOString(),
              updatedAt: row.updated_at || localMatch?.updatedAt || new Date().toISOString(),
            };
          });
        }
      } catch (err) {
        console.warn('Failed to fetch from Supabase, using local fallback:', err);
      }
    }

    // Cross-verify with stored payments to guarantee payment records and dates persist on refresh
    try {
      const rawPayments = await AsyncStorage.getItem('@fee_manager_payments_v2');
      if (rawPayments) {
        const allPayments = JSON.parse(rawPayments);
        return baseStudents.map((s) => {
          const studentPayments = allPayments.filter((p: any) => p.studentId === s.id);
          if (studentPayments.length > 0) {
            const latest = studentPayments[0];
            const isPaid = s.outstandingAmount <= 0 || s.feeStatus === 'paid';
            const nextDeadline = s.nextDeadline || addCalendarDays(latest.paymentDate, 30);
            const daysLeft = getDaysRemaining(nextDeadline);

            return {
              ...s,
              lastPaymentDate: s.lastPaymentDate || latest.paymentDate,
              nextDeadline,
              daysRemaining: daysLeft,
              outstandingAmount: isPaid ? 0 : s.outstandingAmount,
              feeStatus: isPaid ? ('paid' as const) : daysLeft < 0 ? ('overdue' as const) : ('due' as const),
            };
          }
          return s;
        });
      }
    } catch {
      // Fallback to baseStudents
    }

    return baseStudents;
  },

  /**
   * Permanently deletes a student and cleans up related cycles and payments from database
   */
  async deleteStudent(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('payments').delete().eq('student_id', id);
        await supabase.from('billing_cycles').delete().eq('student_id', id);
        await supabase.from('reminder_logs').delete().eq('student_id', id);
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) console.warn('Supabase delete student error:', error);
      } catch (err) {
        console.warn('Failed to delete student from Supabase:', err);
      }
    }
  },

  /**
   * Creates a student record in Supabase and registers the initial billing cycle
   */
  async createStudent(input: CreateStudentInput, studentCode: string): Promise<Student> {
    const admissionDate = input.admissionDate || getTodayDateString();
    const nextDeadline = addCalendarDays(admissionDate, 30);
    const daysLeft = getDaysRemaining(nextDeadline);

    if (!isSupabaseConfigured) {
      return {
        id: `stu-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        studentCode,
        name: input.name,
        phone: input.phone,
        parentName: input.parentName,
        parentPhone: input.parentPhone,
        monthlyFee: Number(input.monthlyFee),
        status: 'active',
        photoUrl: input.photoUrl,
        admissionDate,
        feeStatus: 'due',
        nextDeadline,
        daysRemaining: daysLeft,
        outstandingAmount: Number(input.monthlyFee),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    try {
      // 1. Insert into students table
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          student_code: studentCode,
          name: input.name,
          phone: input.phone,
          parent_name: input.parentName || null,
          parent_phone: input.parentPhone || null,
          monthly_fee: Number(input.monthlyFee),
          status: 'active',
          photo_url: input.photoUrl || null,
          admission_date: admissionDate,
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // 2. Create initial billing cycle (Day 0 to Day 30)
      await supabase.from('billing_cycles').insert({
        student_id: studentData.id,
        cycle_start_date: admissionDate,
        cycle_due_date: nextDeadline,
        fee_amount: Number(input.monthlyFee),
        amount_paid: 0,
        is_fully_paid: false,
        is_overdue: false,
      });

      return {
        id: studentData.id,
        studentCode: studentData.student_code,
        name: studentData.name,
        phone: studentData.phone,
        parentName: studentData.parent_name || undefined,
        parentPhone: studentData.parent_phone || undefined,
        monthlyFee: Number(studentData.monthly_fee),
        status: studentData.status,
        photoUrl: studentData.photo_url || undefined,
        admissionDate: studentData.admission_date,
        feeStatus: 'due',
        nextDeadline,
        daysRemaining: daysLeft,
        outstandingAmount: Number(studentData.monthly_fee),
        createdAt: studentData.created_at,
        updatedAt: studentData.updated_at,
      };
    } catch (err) {
      console.warn('Supabase insert failed, fallback to local:', err);
      return {
        id: `stu-${Date.now()}`,
        studentCode,
        name: input.name,
        phone: input.phone,
        parentName: input.parentName,
        parentPhone: input.parentPhone,
        monthlyFee: Number(input.monthlyFee),
        status: 'active',
        photoUrl: input.photoUrl,
        admissionDate,
        feeStatus: 'due',
        nextDeadline,
        daysRemaining: daysLeft,
        outstandingAmount: Number(input.monthlyFee),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Updates an existing student record in Supabase
   */
  async updateStudent(id: string, input: UpdateStudentInput): Promise<void> {
    if (!isSupabaseConfigured) return;

    try {
      const updates: Record<string, any> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.phone !== undefined) updates.phone = input.phone;
      if (input.parentName !== undefined) updates.parent_name = input.parentName;
      if (input.parentPhone !== undefined) updates.parent_phone = input.parentPhone;
      if (input.monthlyFee !== undefined) updates.monthly_fee = Number(input.monthlyFee);
      if (input.photoUrl !== undefined) updates.photo_url = input.photoUrl;
      if (input.status !== undefined) updates.status = input.status;

      const { error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.warn('Failed to update student in Supabase:', err);
    }
  },

  /**
   * Uploads student photo to Supabase Storage bucket 'student-photos'
   */
  async uploadPhoto(uri: string, studentCode: string): Promise<string | null> {
    if (!isSupabaseConfigured || !uri) return uri;

    // If it's already a remote URL, no upload needed
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }

    try {
      const filename = `${studentCode}-${Date.now()}.jpg`;
      let uploadBody: ArrayBuffer | Blob;

      if (uri.startsWith('data:')) {
        // Strip data URI prefix and decode to ArrayBuffer in memory (bypasses Android native fetch)
        const commaIdx = uri.indexOf(',');
        const base64Data = commaIdx >= 0 ? uri.substring(commaIdx + 1) : uri;
        uploadBody = decodeBase64ToArrayBuffer(base64Data);
      } else {
        const response = await fetch(uri);
        uploadBody = await response.blob();
      }

      const { error } = await supabase.storage
        .from('student-photos')
        .upload(filename, uploadBody, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        return uri;
      }

      const { data } = supabase.storage
        .from('student-photos')
        .getPublicUrl(filename);

      return data?.publicUrl || uri;
    } catch {
      return uri;
    }
  },
};
