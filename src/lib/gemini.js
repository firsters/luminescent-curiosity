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
  if (!API_KEY) {
    console.warn("Gemini API Key is missing from env.");
    return {
      error:
        "API Key가 설정되지 않았습니다. (.env 파일 확인 및 서버 재시작 필요)",
    };
  }
  if (!genAI) {
    return { error: "Gemini 클라이언트 초기화 실패" };
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
      - boundingBox: [ymin, xmin, ymax, xmax] of the main food item alone, in normalized coordinates (0-1000).

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
      boundingBox: data.boundingBox, // [ymin, xmin, ymax, xmax] (0-1000)
    };
  } catch (error) {
    console.error("[Gemini] Analysis failed:", error);
    return { error: `분석 실패: ${error.message}` };
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
