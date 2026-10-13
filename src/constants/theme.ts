export const COLORS = {
  primary: '#107C41',       // Deep emerald green for primary buttons
  primaryDark: '#0A4D27',   // Darker shade for active/pressed states
  primaryLight: '#E8F5E9',  // Light green tint for badges and highlights
  primaryBorder: '#A3D9B5', // Soft green border

  header: '#0E3824',        // Dark green header requested
  headerText: '#FFFFFF',    // White text on dark green header

  background: '#F4F7F5',    // Light neutral background requested
  card: '#FFFFFF',          // Crisp white cards requested
  cardBorder: '#E2E8F0',    // Subtle border for cards

  textPrimary: '#0F172A',   // High-contrast slate text
  textSecondary: '#475569', // Muted slate text
  textMuted: '#94A3B8',     // Subdued text/placeholders
  border: '#CBD5E1',        // Default input border

  // Status Colors
  status: {
    paid: '#16A34A',
    paidBg: '#DCFCE7',
    paidBorder: '#86EFAC',

    due: '#D97706',
    dueBg: '#FEF3C7',
    dueBorder: '#FCD34D',

    overdue: '#DC2626',
    overdueBg: '#FEE2E2',
    overdueBorder: '#FCA5A5',

    partial: '#2563EB',
    partialBg: '#DBEAFE',
    partialBorder: '#93C5FD',

    inactive: '#64748B',
    inactiveBg: '#F1F5F9',
    inactiveBorder: '#CBD5E1',
  },

  white: '#FFFFFF',
  black: '#000000',
  error: '#EF4444',
  errorLight: '#FEE2E2',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#0E3824',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardElevated: {
    shadowColor: '#0E3824',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
};
