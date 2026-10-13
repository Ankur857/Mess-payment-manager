import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { useStudents } from '../../context/StudentContext';

export default function AddStudentScreen() {
  const router = useRouter();
  const { addStudent, peekNextStudentCode } = useStudents();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState('STU-2026-0001');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    peekNextStudentCode().then(setPreviewCode).catch(() => {});
  }, []);

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
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
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
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Student full name is required';

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone) {
      errs.phone = 'Phone number is required';
    } else if (cleanPhone.length < 10) {
      errs.phone = 'Enter valid 10-digit mobile number';
    }

    if (!monthlyFee.trim()) {
      errs.monthlyFee = 'Monthly fee amount is required';
    } else if (isNaN(Number(monthlyFee)) || Number(monthlyFee) <= 0) {
      errs.monthlyFee = 'Fee must be a valid positive amount';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const created = await addStudent({
        name: name.trim(),
        phone: phone.trim(),
        parentName: parentName.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        monthlyFee: Number(monthlyFee),
        photoUrl: photoUri || undefined,
      });

      setLoading(false);
      Alert.alert(
        'Student Registered 🎉',
        `${created.name} (${created.studentCode}) was successfully added with monthly fee ₹${created.monthlyFee.toLocaleString()}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      setLoading(false);
      Alert.alert('Error', 'Failed to register student. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Photo Selection Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={40} color={COLORS.textMuted} />
                <Text style={styles.photoPlaceholderText}>Student Photo</Text>
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
          </View>
        </View>

        {/* Auto Generated Code Preview */}
        <View style={styles.codeBanner}>
          <Ionicons name="barcode-outline" size={18} color={COLORS.primary} />
          <Text style={styles.codeBannerText}>
            Assigned Code: <Text style={styles.codeHighlight}>{previewCode}</Text> (Immutable)
          </Text>
        </View>

        {/* Form Fields Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Input
            label="Student Full Name *"
            placeholder="e.g. Rohit Sharma"
            value={name}
            onChangeText={setName}
            error={errors.name}
            leftIcon={<Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />}
          />

          <Input
            label="WhatsApp / Mobile Phone *"
            placeholder="e.g. 9876543210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            error={errors.phone}
            helperText="WhatsApp fee reminders will be sent to this number"
            leftIcon={<Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />}
          />

          <Input
            label="Monthly Fee Amount (₹) *"
            placeholder="e.g. 3500"
            value={monthlyFee}
            onChangeText={setMonthlyFee}
            keyboardType="numeric"
            error={errors.monthlyFee}
            leftIcon={<Ionicons name="cash-outline" size={18} color={COLORS.textSecondary} />}
          />

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Parent / Guardian Details (Optional)</Text>

          <Input
            label="Parent / Guardian Name"
            placeholder="e.g. Suresh Sharma"
            value={parentName}
            onChangeText={setParentName}
            leftIcon={<Ionicons name="people-outline" size={18} color={COLORS.textSecondary} />}
          />

          <Input
            label="Parent Phone"
            placeholder="e.g. 9876543211"
            value={parentPhone}
            onChangeText={setParentPhone}
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />}
          />

          <Button
            title="Save Student Record"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
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
  photoSection: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  photoContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  photoPlaceholderText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 4,
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
  codeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  codeBannerText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  codeHighlight: {
    fontWeight: '800',
    color: COLORS.primaryDark,
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
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.md,
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
});
