import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { LoadingState } from '../../../components/common/LoadingState';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../../constants/theme';
import { usePayments } from '../../../context/PaymentContext';
import { useStudents } from '../../../context/StudentContext';
import { formatDisplayDate } from '../../../utils/date';
import { openStudentWhatsApp } from '../../../utils/whatsappHelper';

export default function StudentProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getStudentById, deleteStudent, updateStudent, loading: studentLoading } = useStudents();
  const { getStudentPayments } = usePayments();
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  const student = getStudentById(String(id));
  const studentPayments = student ? getStudentPayments(student.id) : [];

  if (studentLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (!student) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorTitle}>Student Not Found</Text>
        <Text style={styles.errorSubtitle}>
          The requested student ID does not match any registered records.
        </Text>
        <Button
          title="Back to Directory"
          onPress={() => router.back()}
          style={{ marginTop: SPACING.lg }}
        />
      </View>
    );
  }

  const latestPayment = studentPayments.length > 0 ? studentPayments[0] : null;
  const lastPaymentAmount = latestPayment
    ? latestPayment.amount
    : student.lastPaymentDate
    ? student.monthlyFee
    : null;
  const lastPaymentDate = latestPayment ? latestPayment.paymentDate : student.lastPaymentDate;
  const lastPaymentMethod = latestPayment ? latestPayment.paymentMethod : null;
  const lastPaymentRef = latestPayment ? latestPayment.transactionRef : null;

  const handleCapturePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setImageError(false);
        await updateStudent(student.id, { photoUrl: newUri });
        Alert.alert('Success 🎉', 'Student profile photo updated.');
      }
    } catch {
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Media library permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setImageError(false);
        await updateStudent(student.id, { photoUrl: newUri });
        Alert.alert('Success 🎉', 'Student profile photo updated.');
      }
    } catch {
      Alert.alert('Error', 'Failed to select photo.');
    }
  };

  const handlePhotoOptions = () => {
    Alert.alert(
      'Profile Photo Options',
      'Change or remove student photo:',
      [
        { text: 'Take Photo (Camera)', onPress: handleCapturePhoto },
        { text: 'Choose from Gallery', onPress: handlePickImage },
        ...(student?.photoUrl
          ? [
              {
                text: 'Remove Photo',
                style: 'destructive' as const,
                onPress: async () => {
                  try {
                    await updateStudent(student.id, { photoUrl: '' });
                    setImageError(false);
                  } catch {
                    Alert.alert('Error', 'Failed to remove photo.');
                  }
                },
              },
            ]
          : []),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAvatarPress = () => {
    if (student?.photoUrl && !imageError) {
      setPhotoModalVisible(true);
    } else {
      handlePhotoOptions();
    }
  };

  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    if (cleanNumber) {
      Linking.openURL(`tel:${cleanNumber}`).catch(() => {
        Alert.alert('Error', 'Unable to initiate phone call on this device.');
      });
    }
  };

  const handleWhatsApp = () => {
    openStudentWhatsApp(student);
  };

  const handleDeleteStudent = async () => {
    try {
      setDeleteVisible(false);
      await deleteStudent(student.id);
      Alert.alert(
        'Student Deleted',
        `${student.name} has been permanently removed from the database.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/students'),
          },
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to delete student.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarRow}>
          <TouchableOpacity
            style={styles.avatarTouchWrapper}
            onPress={handleAvatarPress}
            activeOpacity={0.8}
          >
            <View style={styles.avatarContainer}>
              {student.photoUrl && !imageError ? (
                <Image
                  source={{ uri: student.photoUrl }}
                  style={styles.avatar}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {student.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={(e) => {
                e.stopPropagation();
                handlePhotoOptions();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={13} color={COLORS.white} />
            </TouchableOpacity>
          </TouchableOpacity>

          <View style={styles.profileMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {student.name}
              </Text>
            </View>
            <Text style={styles.codeText}>{student.studentCode}</Text>
            <View style={styles.badgeRow}>
              <Badge status={student.feeStatus} />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Button
            title="Record Payment"
            icon={<Ionicons name="card-outline" size={16} color={COLORS.white} />}
            onPress={() =>
              router.push({
                pathname: '/students/[id]/record-payment',
                params: { id: student.id },
              })
            }
            style={styles.actionButton}
          />
          <Button
            title="Edit"
            variant="outline"
            icon={<Ionicons name="create-outline" size={16} color={COLORS.primary} />}
            onPress={() =>
              router.push({
                pathname: '/students/[id]/edit',
                params: { id: student.id },
              })
            }
            style={styles.editButton}
          />
        </View>

        {/* Prominent WhatsApp Fee Reminder Notice Button */}
        {student.outstandingAmount > 0 ? (
          <TouchableOpacity
            style={styles.whatsappReminderBar}
            onPress={handleWhatsApp}
            activeOpacity={0.8}
          >
            <View style={styles.waIconCircle}>
              <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.waTextContainer}>
              <Text style={styles.waTitle}>Send Fee Reminder on WhatsApp</Text>
              <Text style={styles.waSubtitle}>
                Pre-fills ₹{student.outstandingAmount.toLocaleString()} pending fee notice
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#15803D" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Last Payment Highlights Card */}
      <View style={styles.lastPaymentCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="receipt" size={18} color={COLORS.status.paid} />
          </View>
          <Text style={styles.cardTitle}>Last Payment Record</Text>
        </View>

        {lastPaymentDate ? (
          <View style={styles.lastPaymentContent}>
            <View style={styles.lastPaymentHeroRow}>
              <View>
                <Text style={styles.lastPaymentLabel}>Last Paid Amount</Text>
                <Text style={styles.lastPaymentHeroAmount}>
                  ₹{(lastPaymentAmount ?? student.monthlyFee).toLocaleString()}
                </Text>
              </View>
              <View style={styles.lastPaymentDatePill}>
                <Ionicons name="checkmark-circle" size={15} color={COLORS.status.paid} />
                <Text style={styles.lastPaymentDateText}>
                  {formatDisplayDate(lastPaymentDate)}
                </Text>
              </View>
            </View>

            <View style={styles.lastPaymentMetaBar}>
              <View style={styles.lastPaymentMetaCol}>
                <Text style={styles.metaLabel}>Payment Mode</Text>
                <Text style={styles.metaVal}>
                  {lastPaymentMethod ? lastPaymentMethod.replace('_', ' ').toUpperCase() : 'DIRECT'}
                </Text>
              </View>
              <View style={styles.lastPaymentMetaCol}>
                <Text style={styles.metaLabel}>Reference / Receipt</Text>
                <Text style={styles.metaVal} numberOfLines={1}>
                  {lastPaymentRef || 'Direct Entry'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noPaymentNotice}>
            <Ionicons name="time-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.noPaymentNoticeText}>No payment has been recorded yet.</Text>
          </View>
        )}
      </View>

      {/* 30-Day Billing Cycle Status Card */}
      <View style={styles.billingCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
          <Text style={styles.cardTitle}>30-Day Billing Cycle</Text>
        </View>

        <View style={styles.billingGrid}>
          <View style={styles.billingItem}>
            <Text style={styles.billingLabel}>Last Payment Date</Text>
            <Text style={styles.billingValue}>
              {lastPaymentDate ? formatDisplayDate(lastPaymentDate) : 'None Recorded'}
            </Text>
          </View>
          <View style={styles.billingItem}>
            <Text style={styles.billingLabel}>Next Deadline (+30 Days)</Text>
            <Text
              style={[
                styles.billingValue,
                student.feeStatus === 'overdue' ? styles.overdueDate : null,
              ]}
            >
              {formatDisplayDate(student.nextDeadline)}
            </Text>
          </View>
          <View style={styles.billingItem}>
            <Text style={styles.billingLabel}>Days Remaining</Text>
            <Text
              style={[
                styles.billingValue,
                student.daysRemaining < 0 ? styles.overdueValue : styles.positiveValue,
              ]}
            >
              {student.daysRemaining < 0
                ? `${Math.abs(student.daysRemaining)} Days Overdue`
                : `${student.daysRemaining} Days Left`}
            </Text>
          </View>
          <View style={styles.billingItem}>
            <Text style={styles.billingLabel}>Outstanding Balance</Text>
            <Text style={[styles.billingValue, styles.outstandingValue]}>
              ₹{student.outstandingAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.cycleNotice}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primaryDark} />
          <Text style={styles.cycleNoticeText}>
            Billing deadlines advance 30 days upon qualifying payments. Automated reminders trigger on Day 31 for overdue accounts.
          </Text>
        </View>
      </View>

      {/* Contact Details Card */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Contact Details</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <Ionicons name="call-outline" size={16} color={COLORS.primary} />
          </View>
          <View style={styles.infoTextBox}>
            <Text style={styles.infoLabel}>Student WhatsApp / Phone</Text>
            <Text style={styles.infoValue}>{student.phone}</Text>
          </View>
          <View style={styles.contactActionButtons}>
            <TouchableOpacity
              style={styles.contactIconBtn}
              onPress={() => handleCall(student.phone)}
            >
              <Ionicons name="call" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contactIconBtn, styles.whatsappBtn]}
              onPress={handleWhatsApp}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            </TouchableOpacity>
          </View>
        </View>

        {student.parentName ? (
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="people-outline" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.infoTextBox}>
              <Text style={styles.infoLabel}>Parent / Guardian</Text>
              <Text style={styles.infoValue}>
                {student.parentName} {student.parentPhone ? `(${student.parentPhone})` : ''}
              </Text>
            </View>
            {student.parentPhone ? (
              <TouchableOpacity
                style={styles.contactIconBtn}
                onPress={() => handleCall(student.parentPhone!)}
              >
                <Ionicons name="call" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <View style={styles.infoIconBox}>
            <Ionicons name="cash-outline" size={16} color={COLORS.primary} />
          </View>
          <View style={styles.infoTextBox}>
            <Text style={styles.infoLabel}>Configured Monthly Fee</Text>
            <Text style={styles.infoValue}>₹{student.monthlyFee.toLocaleString()} / month</Text>
          </View>
        </View>
      </View>

      {/* Payment Ledger for This Student */}
      <View style={styles.infoCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="file-tray-full-outline" size={18} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Complete Payment Ledger</Text>
        </View>
        {studentPayments.length > 0 ? (
          studentPayments.map((payment) => (
            <View key={payment.id} style={styles.historyRow}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyAmount}>+₹{payment.amount.toLocaleString()}</Text>
                <Text style={styles.historyDate}>
                  {formatDisplayDate(payment.paymentDate)} • {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyRef}>{payment.transactionRef || 'Direct Receipt'}</Text>
                {payment.notes ? (
                  <Text style={styles.historyNotes} numberOfLines={1}>
                    {payment.notes}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noPaymentsText}>No payments recorded yet for this student.</Text>
        )}
      </View>

      {/* Permanent Delete Action */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => setDeleteVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={17} color={COLORS.error} />
        <Text style={styles.deleteText}>Delete Student Permanently</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={deleteVisible}
        title="Delete Student Permanently"
        message={`Are you sure you want to permanently delete ${student.name} (${student.studentCode})? All records will be removed from the database and this action cannot be undone.`}
        confirmText="Delete Permanently"
        isDestructive={true}
        onConfirm={handleDeleteStudent}
        onCancel={() => setDeleteVisible(false)}
      />

      {/* Full Profile Photo View Modal with Close/Cross Button */}
      <Modal
        visible={photoModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          {/* Backdrop click to dismiss */}
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setPhotoModalVisible(false)}
          />

          <View style={styles.modalCard}>
            {/* Modal Header with Title & Cross Button */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleCol}>
                <Text style={styles.modalStudentName} numberOfLines={1}>
                  {student.name}
                </Text>
                <Text style={styles.modalStudentCode}>
                  {student.studentCode} • Profile Photo
                </Text>
              </View>

              {/* Cross (Close) Button */}
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPhotoModalVisible(false)}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* High-Resolution Photo Container */}
            <View style={styles.modalImageContainer}>
              {student.photoUrl && !imageError ? (
                <Image
                  source={{ uri: student.photoUrl }}
                  style={styles.modalFullImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.modalPlaceholder}>
                  <Text style={styles.modalPlaceholderInitial}>
                    {student.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Modal Footer Controls */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalChangeBtn}
                onPress={() => {
                  setPhotoModalVisible(false);
                  setTimeout(() => handlePhotoOptions(), 300);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={17} color="#FFFFFF" />
                <Text style={styles.modalChangeBtnText}>Change Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setPhotoModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle-outline" size={17} color="#FFFFFF" />
                <Text style={styles.modalDoneBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  errorSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 20,
  },
  profileHeaderCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  avatarTouchWrapper: {
    position: 'relative',
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  profileMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  codeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 2,
  },
  editButton: {
    flex: 1,
  },
  billingCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  billingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  billingItem: {
    width: '46%',
  },
  billingLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  billingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  overdueDate: {
    color: COLORS.status.overdue,
  },
  overdueValue: {
    color: COLORS.status.overdue,
  },
  positiveValue: {
    color: COLORS.status.paid,
  },
  outstandingValue: {
    color: COLORS.status.due,
  },
  cycleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  cycleNoticeText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.primaryDark,
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextBox: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  lastPaymentCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.status.paid + '40',
    ...SHADOWS.card,
  },
  headerIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.status.paid + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastPaymentContent: {
    marginTop: 4,
  },
  lastPaymentHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  lastPaymentLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  lastPaymentHeroAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.status.paid,
    marginTop: 2,
  },
  lastPaymentDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.status.paid + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  lastPaymentDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.status.paid,
  },
  lastPaymentMetaBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  lastPaymentMetaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  noPaymentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: SPACING.sm,
  },
  noPaymentNoticeText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  contactActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contactIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  whatsappBtn: {
    backgroundColor: '#DCF8C6',
    borderColor: '#25D36640',
  },
  historyLeft: {
    flex: 1,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyNotes: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    marginTop: 4,
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.status.paid,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyRef: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  noPaymentsText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    paddingVertical: SPACING.md,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACING.md,
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalDismissArea: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#111827',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#374151',
    ...SHADOWS.cardElevated,
    zIndex: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  modalTitleCol: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  modalStudentName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  modalStudentCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  modalImageContainer: {
    width: '100%',
    height: 340,
    backgroundColor: '#030712',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  modalFullImage: {
    width: '100%',
    height: '100%',
  },
  modalPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPlaceholderInitial: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  modalChangeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalChangeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  modalDoneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  modalDoneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  whatsappReminderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  waIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  waTextContainer: {
    flex: 1,
  },
  waTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14532D',
  },
  waSubtitle: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 1,
  },
});
