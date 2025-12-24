/**
 * Safely converts various date inputs to YYYY-MM-DD string using local time components.
 * This avoids the "off-by-one" day bug caused by UTC shifts (toISOString).
 */
export const safeDateToIso = (dateInput) => {
  try {
    let dateObj;
    if (!dateInput) {
      dateObj = new Date();
    } else if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else if (dateInput?.toDate && typeof dateInput.toDate === "function") {
      // Handle Firestore Timestamp
      dateObj = dateInput.toDate();
    } else if (
      typeof dateInput === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
    ) {
      // Already YYYY-MM-DD string, just return it
      return dateInput;
    } else {
      // Fallback for other strings or numbers
      dateObj = new Date(dateInput);
    }

    if (isNaN(dateObj.getTime())) {
      dateObj = new Date();
    }

    // Use Local time components to avoid UTC shift
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Date parsing error", e);
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;
  }
};

/**
 * Parses a YYYY-MM-DD string into a JS Date object at local midnight (00:00:00).
 */
export const parseLocal = (dateStr) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Calculates days until expiry based on local midnight normalization.
 */
export const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry - today;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};
