const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const DISPLAY_DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const pad = (value: number): string => value.toString().padStart(2, "0");

const isValidUTCDate = (year: number, month: number, day: number): boolean => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const toISODateOnly = (value: unknown): string | null => {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(ISO_DATE_REGEX);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (!isValidUTCDate(year, month, day)) return null;
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  const displayMatch = trimmed.match(DISPLAY_DATE_REGEX);
  if (displayMatch) {
    const day = Number(displayMatch[1]);
    const month = Number(displayMatch[2]);
    const year = Number(displayMatch[3]);
    if (!isValidUTCDate(year, month, day)) return null;
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getUTCFullYear();
  const month = parsed.getUTCMonth() + 1;
  const day = parsed.getUTCDate();
  return `${year}-${pad(month)}-${pad(day)}`;
};

export const formatDateDMY = (value: unknown): string => {
  const iso = toISODateOnly(value);
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
};

export const toISODateTimeString = (value: unknown): string | null => {
  const isoDate = toISODateOnly(value);
  if (!isoDate) return null;
  return new Date(`${isoDate}T00:00:00.000Z`).toISOString();
};

/**
 * Format date as DD/MM/YYYY
 */
export const formatDateDMYShort = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format date with time as DD/MM/YYYY, HH:MM
 */
export const formatDateTimeDMY = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year}, ${hours}:${minutes}`;
};

/**
 * Format date in long format: DD Month YYYY
 */
export const formatDateDMYLong = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  const day = date.getDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};
