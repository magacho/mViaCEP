// Framework-agnostic CEP utilities. No React/Vue/Angular/DOM imports allowed here.

const CEP_LENGTH = 8;
const HYPHEN_POSITION = 5;

/**
 * Strips every non-digit character and returns the remaining digits.
 * Does NOT validate length — it only cleans the input.
 */
export function normalize(cep: string): string {
  return cep.replace(/\D/g, "");
}

/**
 * Returns true iff, after normalizing, the CEP is exactly 8 digits.
 */
export function isValid(cep: string): boolean {
  return normalize(cep).length === CEP_LENGTH;
}

/**
 * Formats a CEP as `00000-000`.
 *
 * If there are 8 or more digits after normalizing, the first 8 are used and
 * the hyphen is inserted. Otherwise the best partial masking of the available
 * digits is returned (hyphen only once more than 5 digits are present).
 * Never throws.
 */
export function mask(cep: string): string {
  const digits = normalize(cep).slice(0, CEP_LENGTH);

  if (digits.length <= HYPHEN_POSITION) {
    return digits;
  }

  return `${digits.slice(0, HYPHEN_POSITION)}-${digits.slice(HYPHEN_POSITION)}`;
}
