import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { ReminderTemplate } from '../../types/reminder';

const DEFAULT_TEMPLATES: ReminderTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Day 31 Overdue Notice',
    templateCode: 'fee_reminder_overdue_v1',
    language: 'en_US',
    body: 'Dear {{student_name}} ({{student_code}}), your monthly fee of ₹{{amount}} was due on {{due_date}}. Kindly make payment today to avoid interruption in classes. Thank you.',
    isActive: true,
  },
  {
    id: 'tpl-2',
    name: 'Payment Receipt Confirmation',
    templateCode: 'payment_received_receipt_v1',
    language: 'en_US',
    body: 'Dear {{student_name}}, we have received your payment of ₹{{amount}} via {{method}} on {{date}}. Next billing deadline is {{next_due}}. Thank you!',
    isActive: true,
  },
];

export default function WhatsAppTemplatesScreen() {
  const [templates, setTemplates] = useState<ReminderTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplate>(DEFAULT_TEMPLATES[0]);
  const [editedBody, setEditedBody] = useState(DEFAULT_TEMPLATES[0].body);

  const sampleStudentName = 'Aarav Sharma';
  const sampleCode = 'STU-2026-0001';
  const sampleAmount = '3,500';
  const sampleDueDate = '2026-02-09';

  const previewRendered = editedBody
    .replace('{{student_name}}', sampleStudentName)
    .replace('{{student_code}}', sampleCode)
    .replace('{{amount}}', sampleAmount)
    .replace('{{due_date}}', sampleDueDate);

  const handleSave = () => {
    Alert.alert('Saved', 'Template configuration updated.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Meta API Verification Notice */}
      <View style={styles.complianceNotice}>
        <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
        <View style={styles.complianceTextContainer}>
          <Text style={styles.complianceTitle}>Official WhatsApp Cloud API</Text>
          <Text style={styles.complianceSubtext}>
            Message templates must be submitted and approved in your Meta Business Suite before initiating customer-facing outbound notifications.
          </Text>
        </View>
      </View>

      {/* Template Selector Pills */}
      <View style={styles.selectorRow}>
        {templates.map((tpl) => {
          const isSelected = selectedTemplate.id === tpl.id;
          return (
            <TouchableOpacity
              key={tpl.id}
              style={[styles.pill, isSelected ? styles.pillActive : null]}
              onPress={() => {
                setSelectedTemplate(tpl);
                setEditedBody(tpl.body);
              }}
            >
              <Text style={[styles.pillText, isSelected ? styles.pillTextActive : null]}>
                {tpl.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Editor Card */}
      <View style={styles.card}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Meta Template Code:</Text>
          <Text style={styles.metaValue}>{selectedTemplate.templateCode}</Text>
        </View>

        <Input
          label="Template Body & Variables"
          value={editedBody}
          onChangeText={setEditedBody}
          multiline
          numberOfLines={4}
          inputStyle={styles.textArea}
          helperText="Supported tags: {{student_name}}, {{student_code}}, {{amount}}, {{due_date}}"
        />

        <Button
          title="Save Template Variables"
          onPress={handleSave}
          style={styles.saveBtn}
        />
      </View>

      {/* Live Preview Card */}
      <Text style={styles.previewHeading}>Live WhatsApp Preview</Text>
      <View style={styles.chatBubbleCard}>
        <View style={styles.whatsappHeader}>
          <View style={styles.waAvatar}>
            <Ionicons name="business" size={16} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.waSenderTitle}>Fee Manager Admin</Text>
            <Text style={styles.waSenderSub}>Official Business Account</Text>
          </View>
        </View>

        <View style={styles.chatBubble}>
          <Text style={styles.chatText}>{previewRendered}</Text>
          <Text style={styles.chatTimestamp}>09:00 AM • ✓✓</Text>
        </View>
      </View>
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
  complianceNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    marginBottom: SPACING.lg,
  },
  complianceTextContainer: {
    flex: 1,
  },
  complianceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  complianceSubtext: {
    fontSize: 11,
    color: COLORS.primaryDark,
    marginTop: 2,
    lineHeight: 16,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  pillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  pillTextActive: {
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  metaLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: SPACING.sm,
  },
  previewHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  chatBubbleCard: {
    backgroundColor: '#EFEAE2', // WhatsApp chat background color
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  whatsappHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: SPACING.xs + 2,
    borderRadius: RADIUS.md,
  },
  waAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#128C7E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waSenderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  waSenderSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  chatBubble: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderTopLeftRadius: 0,
    padding: SPACING.md,
    maxWidth: '90%',
    ...SHADOWS.card,
  },
  chatText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  chatTimestamp: {
    fontSize: 10,
    color: COLORS.textMuted,
    alignSelf: 'flex-end',
    marginTop: 6,
  },
});
