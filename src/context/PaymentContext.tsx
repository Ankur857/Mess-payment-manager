import React, { createContext, useContext, useEffect, useState } from 'react';
import { PaymentService } from '../services/paymentService';
import { Payment, RecordPaymentInput } from '../types/payment';
import { Student } from '../types/student';
import { evaluatePaymentPolicy } from '../utils/billingCycle';
import { useStudents } from './StudentContext';

interface PaymentContextType {
  payments: Payment[];
  loading: boolean;
  recordPayment: (
    input: RecordPaymentInput,
    student: Student
  ) => Promise<{
    payment: Payment;
    newDeadline: string;
    remainingBalance: number;
    isFullPayment: boolean;
  }>;
  getStudentPayments: (studentId: string) => Payment[];
  refreshPayments: () => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { updateStudent } = useStudents();

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await PaymentService.fetchPayments();
      setPayments(data);
    } catch (e) {
      console.error('Failed to load payments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const recordPayment = async (
    input: RecordPaymentInput,
    student: Student
  ): Promise<{
    payment: Payment;
    newDeadline: string;
    remainingBalance: number;
    isFullPayment: boolean;
  }> => {
    // 1. Record payment through PaymentService
    const result = await PaymentService.recordPayment(input, student);

    // 2. Evaluate policy updates on the student record
    const policyResult = evaluatePaymentPolicy(
      student.monthlyFee,
      student.outstandingAmount,
      input.amount,
      input.paymentDate,
      student.nextDeadline
    );

    // 3. Update the student in StudentContext
    await updateStudent(student.id, {
      ...student,
      // If full payment, advance deadline to payment date + 30 days
      // If partial payment, retain existing deadline
    });

    // 4. Prepend new payment to local payments state
    setPayments((prev) => [result.payment, ...prev]);

    return result;
  };

  const getStudentPayments = (studentId: string): Payment[] => {
    return payments.filter((p) => p.studentId === studentId);
  };

  return (
    <PaymentContext.Provider
      value={{
        payments,
        loading,
        recordPayment,
        getStudentPayments,
        refreshPayments: loadPayments,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayments = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayments must be used within a PaymentProvider');
  }
  return context;
};
