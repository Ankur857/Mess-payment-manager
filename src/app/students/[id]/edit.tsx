import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { LoadingState } from '../../../components/common/LoadingState';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../../constants/theme';
import { useStudents } from '../../../context/StudentContext';

export default function EditStudentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getStudentById, updateStudent, deleteStudent, loading: contextLoading } = useStudents();

  const student = getStudentById(String(id));

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (student) {
      setName(student.name);
      setPhone(student.phone);
      setParentName(student.parentName || '');
      setParentPhone(student.parentPhone || '');
      setMonthlyFee(String(student.monthlyFee));
      setPhotoUri(student.photoUrl || null);
    }
  }, [student]);

  if (contextLoading) {
    return <LoadingState message="Loading student..." />;
  }

  if (!student) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorTitle}>Student Not Found</Text>
        <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: SPACING.md }} />
      </View>
    );
  }

  const handleDeleteStudent = () => {
    Alert.alert(
      'Delete Student Permanently',
      `Are you sure you want to permanently delete ${student.name} (${student.studentCode})? All records will be removed from the database and this action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(student.id);
              Alert.alert('Student Deleted', `${student.name} has been permanently removed.`, [
                { text: 'OK', onPress: () => router.replace('/(tabs)/students') },
              ]);
            } catch {
              Alert.alert('Error', 'Failed to delete student.');
            }
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera roll permission is required to select student photo.');
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
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setPhotoUri(uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick photo.');
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to capture photo.');
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
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setPhotoUri(uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Student name is required';
    if (!phone.trim()) errs.phone = 'Phone number is required';
    if (!monthlyFee.trim() || isNaN(Number(monthlyFee)) || Number(monthlyFee) <= 0) {
      errs.monthlyFee = 'Enter a valid positive fee';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      await updateStudent(student.id, {
        name: name.trim(),
        phone: phone.trim(),
        parentName: parentName.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        monthlyFee: Number(monthlyFee),
        photoUrl: photoUri || '',
      });

      setLoading(false);
      Alert.alert('Saved', 'Student details updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      setLoading(false);
      Alert.alert('Error', 'Failed to update student.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Immutable Student Code Callout */}
        <View style={styles.codeBanner}>
          <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />
          <View>
            <Text style={styles.codeLabel}>Student Code (Immutable Database Key)</Text>
            <Text style={styles.codeValue}>{student.studentCode}</Text>
          </View>
        </View>

        {/* Photo Selection */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={44} color={COLORS.primary} />
              </View>
            )}
          </View>
          <View style={styles.photoButtonRow}>
            <TouchableOpacity style={styles.photoActionButton} onPress={handleCapturePhoto}>
              <Ionicons name="camera" size={16} color={COLORS.primary} />
              <Text style={styles.photoActionText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoActionButton} onPress={handlePickImage}>
              <Ionicons name="images" size={16} color={COLORS.primary} />
              <Text style={styles.photoActionText}>Gallery</Text>
            </TouchableOpacity>
            {photoUri ? (
              <TouchableOpacity
                style={[styles.photoActionButton, styles.photoRemoveButton]}
                onPress={() => setPhotoUri(null)}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                <Text style={[styles.photoActionText, { color: COLORS.error }]}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Input
            label="Student Full Name *"
            value={name}
            onChangeText={setName}
            error={errors.name}
            leftIcon={<Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />}
          />

          <Input
            label="Phone Number *"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            error={errors.phone}
            leftIcon={<Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />}
          />

          <Input
            label="Monthly Fee Amount (₹) *"
            value={monthlyFee}
            onChangeText={setMonthlyFee}
            keyboardType="numeric"
            error={errors.monthlyFee}
            leftIcon={<Ionicons name="cash-outline" size={18} color={COLORS.textSecondary} />}
          />

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Guardian Details</Text>

          <Input
            label="Parent / Guardian Name"
            value={parentName}
            onChangeText={setParentName}
            leftIcon={<Ionicons name="people-outline" size={18} color={COLORS.textSecondary} />}
          />

          <Input
            label="Parent Phone"
            value={parentPhone}
            onChangeText={setParentPhone}
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />}
          />

          <View style={styles.ruleNotice}>
            <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.primaryDark} />
            <Text style={styles.ruleNoticeText}>
              Updating student metadata will not alter or reset existing billing cycles.
            </Text>
          </View>

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={styles.saveBtn}
          />

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDeleteStudent}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={17} color={COLORS.error} />
            <Text style={styles.deleteText}>Delete Student Permanently</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  codeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  codeLabel: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  codeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.header,
    marginTop: 1,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  photoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    marginBottom: SPACING.sm,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  photoButtonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  photoActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  photoRemoveButton: {
    borderColor: COLORS.error + '40',
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.card,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.md,
  },
  ruleNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginVertical: SPACING.sm,
  },
  ruleNoticeText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.primaryDark,
    lineHeight: 16,
  },
  saveBtn: {
    marginTop: SPACING.md,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACING.md,
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginTop: SPACING.md,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.error,
  },
});
