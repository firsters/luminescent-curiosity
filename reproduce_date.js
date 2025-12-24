
const safeDateToIso = (dateInput) => {
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

// Test cases
console.log("Current Timezone Offset:", new Date().getTimezoneOffset());

const d1 = new Date(2023, 9, 10); // Oct 10, Local Midnight
console.log("Local Date Object:", d1.toString());
console.log("safeDateToIso(d1):", safeDateToIso(d1));

const isoStr = d1.toISOString();
console.log("ISO String:", isoStr);
console.log("safeDateToIso(isoStr):", safeDateToIso(isoStr));

// Simulate JSON serialization/deserialization (which happens in some history states or storage)
const jsonStr = JSON.stringify(d1); // ""2023-10-09T15:00:00.000Z"" (quotes included)
const parsedStr = JSON.parse(jsonStr); // "2023-10-09T15:00:00.000Z"
console.log("JSON Parsed String:", parsedStr);
console.log("safeDateToIso(parsedStr):", safeDateToIso(parsedStr));

// Test what happens if we pass a timestamp number
const ts = d1.getTime();
console.log("Timestamp Number:", ts);
console.log("safeDateToIso(ts):", safeDateToIso(ts));
