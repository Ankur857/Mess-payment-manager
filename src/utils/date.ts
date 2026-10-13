/**
 * Returns today's date formatted as YYYY-MM-DD in local timezone.
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates a date by adding N calendar days to a base YYYY-MM-DD date.
 * Safely handles month boundaries, year boundaries, and leap years.
 */
export function addCalendarDays(baseDateStr: string, days: number): string {
  const [yearStr, monthStr, dayStr] = baseDateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed
  const day = parseInt(dayStr, 10);

  // Use midday (12:00:00) to eliminate daylight saving or timezone boundary skew
  const d = new Date(year, month, day, 12, 0, 0);
  d.setDate(d.getDate() + days);

  const resYear = d.getFullYear();
  const resMonth = String(d.getMonth() + 1).padStart(2, '0');
  const resDay = String(d.getDate()).padStart(2, '0');
  return `${resYear}-${resMonth}-${resDay}`;
}

/**
 * Returns the exact difference in calendar days between today and a target date.
 * Positive = future (days remaining).
 * Negative = past (days overdue).
 */
export function getDaysRemaining(targetDateStr: string): number {
  const todayStr = getTodayDateString();
  const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number);
  const [tYear, tMonth, tDay] = targetDateStr.split('-').map(Number);

  const todayMid = new Date(todayYear, todayMonth - 1, todayDay, 12, 0, 0).getTime();
  const targetMid = new Date(tYear, tMonth - 1, tDay, 12, 0, 0).getTime();

  const diffMs = targetMid - todayMid;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats a YYYY-MM-DD date string for user-friendly UI display.
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(month, 10) - 1] || month;
    return `${parseInt(day, 10)} ${monthName} ${year}`;
  } catch {
    return dateStr;
  }
}
