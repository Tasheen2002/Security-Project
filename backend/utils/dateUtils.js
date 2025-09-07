// utils/dateUtils.js
// Utility functions for date validation

export function isValidDate(dateStr) {
  // Accepts YYYY-MM-DD format
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
}

export function isSunday(dateStr) {
  const date = new Date(dateStr);
  return date.getDay() === 0;
}

export function isFutureDate(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  return date >= today;
}
