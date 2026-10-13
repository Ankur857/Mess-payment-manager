import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { CreateStudentInput, Student, UpdateStudentInput } from '../types/student';
import { addCalendarDays, getDaysRemaining, getTodayDateString } from '../utils/date';
import { StorageService } from '../utils/storage';

export const StudentService = {
  /**
   * Fetches all students from Supabase (or local storage if not configured)
   */
  async fetchStudents(): Promise<Student[]> {
    if (!isSupabaseConfigured) {
      return await StorageService.getStudents();
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        return await StorageService.getStudents();
      }

      return data.map((row) => {
        const admissionDate = row.admission_date || getTodayDateString();
        const nextDeadline = addCalendarDays(admissionDate, 30);
        const daysLeft = getDaysRemaining(nextDeadline);

        return {
          id: row.id,
          studentCode: row.student_code,
          name: row.name,
          phone: row.phone,
          parentName: row.parent_name || undefined,
          parentPhone: row.parent_phone || undefined,
          monthlyFee: Number(row.monthly_fee),
          status: row.status,
          photoUrl: row.photo_url || undefined,
          admissionDate,
          feeStatus: daysLeft < 0 ? 'overdue' : daysLeft <= 3 ? 'due' : 'due',
          lastPaymentDate: undefined,
          nextDeadline,
          daysRemaining: daysLeft,
          outstandingAmount: Number(row.monthly_fee),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });
    } catch (err) {
      console.warn('Failed to fetch from Supabase, using local fallback:', err);
      return await StorageService.getStudents();
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
    if (!isSupabaseConfigured) return uri;

    try {
      const filename = `${studentCode}-${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from('student-photos')
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from('student-photos')
        .getPublicUrl(filename);

      return data.publicUrl;
    } catch (err) {
      console.warn('Photo upload to Supabase storage failed, using local URI:', err);
      return uri;
    }
  },
};
