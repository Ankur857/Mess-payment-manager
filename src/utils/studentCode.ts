/**
 * Generates an immutable, sequential, formatted student code.
 * Format: STU-YYYY-XXXX (e.g., STU-2026-0001)
 */
export function generateStudentCode(sequenceNumber: number, year?: number): string {
  const currentYear = year || new Date().getFullYear();
  const paddedSequence = String(sequenceNumber).padStart(4, '0');
  return `STU-${currentYear}-${paddedSequence}`;
}

/**
 * Extracts sequence number from an existing student code.
 */
export function extractSequenceFromCode(code: string): number {
  const parts = code.split('-');
  if (parts.length === 3) {
    const seq = parseInt(parts[2], 10);
    return isNaN(seq) ? 0 : seq;
  }
  return 0;
}
