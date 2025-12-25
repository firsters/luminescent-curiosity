import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

/**
 * Analyze an image/file using Gemini Flash to extract food details.
 * @param {File} imageFile
 * @returns {Promise<{name: string, category: string, expiryDate: string} | null>}
 */
export async function analyzeFoodImage(imageFile) {
  if (!genAI) {
    console.warn("Gemini API Key is missing.");
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Convert file to base64
    const base64Data = await fileToGenerativePart(imageFile);

    const prompt = `
      Analyze this image of food. Identify the main food item and return a JSON object with:
      - name: A short, concise name of the food in Korean (e.g., "사과", "우유").
      - category: One of [fruit, vegetable, meat, dairy, frozen, drink, sauce, snack] best matching the item.
      - expiryDays: Estimated shelf life in days from now (integer). E.g., for fresh fruit ~7, milk ~10, frozen ~30.

      Return ONLY the JSON string. No markdown block.
    `;

    const result = await model.generateContent([prompt, base64Data]);
    const response = await result.response;
    const text = response.text();

    console.log("[Gemini] Raw response:", text);

    // Clean up potential markdown formatting (```json ... ```)
    const cleanedText = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanedText);

    // Calculate generic expiry date
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + (data.expiryDays || 7));

    // Format YYYY-MM-DD
    const expiryDateStr = `${expiryDate.getFullYear()}-${String(
      expiryDate.getMonth() + 1
    ).padStart(2, "0")}-${String(expiryDate.getDate()).padStart(2, "0")}`;

    return {
      name: data.name,
      category: data.category,
      expiryDate: expiryDateStr,
    };
  } catch (error) {
    console.error("[Gemini] Analysis failed:", error);
    return null;
  }
}

async function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(",")[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
