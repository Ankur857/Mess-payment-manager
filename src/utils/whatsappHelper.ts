import { Alert, Linking } from 'react-native';
import { Student } from '../types/student';
import { formatDisplayDate } from './date';

/**
 * Generates an automatic, polite and professional WhatsApp payment reminder template
 * personalized with the student's name, student code, pending balance, and due date.
 */
export function generateFeeReminderMessage(student: Student): string {
  const formattedDue = formatDisplayDate(student.nextDeadline);
  const amount = student.outstandingAmount > 0 ? student.outstandingAmount : student.monthlyFee;
  const amountStr = amount.toLocaleString();

  if (student.feeStatus === 'overdue') {
    return (
      `⚠️ *URGENT: MESS FEE OVERDUE NOTICE*\n\n` +
      `Dear *${student.name}* (ID: ${student.studentCode}),\n\n` +
      `This is an overdue reminder from *Raghuvanshi Restorent & Cafe*.\n` +
      `Your mess fee payment of *₹${amountStr}* was due on *${formattedDue}* and is now *OVERDUE*.\n\n` +
      `Kindly clear your pending fee today to avoid any interruption in your mess services.\n\n` +
      `If you have already paid, please ignore this notice.\n\n` +
      `Thank you!\n` +
      `*Raghuvanshi Restorent & Cafe*\n` +
      `_Good Time, Great Test_`
    );
  }

  if (student.feeStatus === 'partial') {
    return (
      `📋 *PENDING MESS FEE BALANCE*\n\n` +
      `Dear *${student.name}* (ID: ${student.studentCode}),\n\n` +
      `Greetings from *Raghuvanshi Restorent & Cafe*.\n` +
      `You have a remaining pending balance of *₹${amountStr}* for your mess subscription.\n` +
      `Due Date: *${formattedDue}*.\n\n` +
      `Kindly arrange to clear the remaining balance at your earliest convenience.\n\n` +
      `Thank you!\n` +
      `*Raghuvanshi Restorent & Cafe*\n` +
      `_Good Time, Great Test_`
    );
  }

  if (student.feeStatus === 'paid' || student.outstandingAmount <= 0) {
    return (
      `✅ *FEE PAYMENT RECEIPT / STATUS*\n\n` +
      `Dear *${student.name}* (ID: ${student.studentCode}),\n\n` +
      `Greetings from *Raghuvanshi Restorent & Cafe*.\n` +
      `Your monthly mess fee is fully cleared! Next billing cycle renewal date is *${formattedDue}*.\n\n` +
      `Thank you for your timely payment.\n\n` +
      `*Raghuvanshi Restorent & Cafe*\n` +
      `_Good Time, Great Test_`
    );
  }

  // Default: 'due' / 'due soon'
  return (
    `🔔 *MESS FEE PAYMENT REMINDER*\n\n` +
    `Dear *${student.name}* (ID: ${student.studentCode}),\n\n` +
    `Greetings from *Raghuvanshi Restorent & Cafe*.\n` +
    `This is a friendly reminder that your monthly mess fee of *₹${amountStr}* is due on *${formattedDue}*.\n\n` +
    `Kindly make the payment on or before the due date to ensure smooth and uninterrupted mess service.\n\n` +
    `Thank you!\n` +
    `*Raghuvanshi Restorent & Cafe*\n` +
    `_Good Time, Great Test_`
  );
}

/**
 * Opens WhatsApp directly to the student's conversation with pre-filled pending fee message.
 */
export async function openStudentWhatsApp(student: Student, customMessage?: string): Promise<void> {
  const cleanDigits = (student.phone || '').replace(/[^0-9]/g, '');
  if (!cleanDigits || cleanDigits.length < 10) {
    Alert.alert('Invalid Number', 'This student does not have a valid 10-digit WhatsApp phone number.');
    return;
  }

  const internationalNumber = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
  const message = customMessage || generateFeeReminderMessage(student);
  const encodedText = encodeURIComponent(message);

  const nativeUrl = `whatsapp://send?phone=${internationalNumber}&text=${encodedText}`;
  const webUrl = `https://wa.me/${internationalNumber}?text=${encodedText}`;

  try {
    const supported = await Linking.canOpenURL(nativeUrl);
    if (supported) {
      await Linking.openURL(nativeUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch {
    try {
      await Linking.openURL(webUrl);
    } catch {
      Alert.alert(
        'WhatsApp Not Available',
        'Unable to open WhatsApp on this device. Please verify WhatsApp is installed.'
      );
    }
  }
}

/**
 * Opens WhatsApp for a phone number with a given message string.
 */
export async function openWhatsAppWithMessage(phoneNumber: string, message: string): Promise<void> {
  const cleanDigits = phoneNumber.replace(/[^0-9]/g, '');
  if (!cleanDigits) {
    Alert.alert('Invalid Number', 'Invalid mobile number for WhatsApp.');
    return;
  }

  const internationalNumber = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
  const encodedText = encodeURIComponent(message);

  const nativeUrl = `whatsapp://send?phone=${internationalNumber}&text=${encodedText}`;
  const webUrl = `https://wa.me/${internationalNumber}?text=${encodedText}`;

  try {
    const supported = await Linking.canOpenURL(nativeUrl);
    if (supported) {
      await Linking.openURL(nativeUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch {
    try {
      await Linking.openURL(webUrl);
    } catch {
      Alert.alert(
        'WhatsApp Not Available',
        'Unable to open WhatsApp on this device. Please verify WhatsApp is installed.'
      );
    }
  }
}
