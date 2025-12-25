/**
 * Korean Ministry of Food and Drug Safety (MFDS) API Client
 * Service: C005 (Food Product Report Information)
 *
 * Note: Requires an API Key from data.go.kr
 */

// TODO: Replace with valid API Key when available
const MFDS_API_KEY = "b5d42bab2a1548eb9618";
// const MFDS_API_KEY = process.env.VITE_MFDS_API_KEY; // Recommended to use env var

export async function fetchProductFromMFDS(barcode) {
  if (!MFDS_API_KEY) {
    console.warn("[MFDS] API Key is missing. Skipping Korean API search.");
    return null;
  }

  try {
    console.log(`[MFDS] Fetching data for barcode: ${barcode}`);

    // C005 Service URL
    // Format: https://openapi.foodsafetykorea.go.kr/api/{keyId}/{serviceId}/{dataType}/{startIdx}/{endIdx}/{PARAM}
    // Param: BAR_CD (Barcode)
    const url = `https://openapi.foodsafetykorea.go.kr/api/${MFDS_API_KEY}/C005/json/1/1/BAR_CD=${barcode}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[MFDS] API Error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log("[MFDS] Response:", data);

    // Check response code
    // C005 returns { C005: { total_count: "...", row: [...], RESULT: { CODE: "INFO-000", MSG: "..." } } }
    const serviceData = data.C005;

    if (serviceData && serviceData.row && serviceData.row.length > 0) {
      const item = serviceData.row[0];

      // Map fields
      const name = item.PRDLST_NM || "알 수 없는 제품";
      const brand = item.BSSH_NM || ""; // Manufacturer/Brand
      const category = mapKoreanCategory(item.PRDLST_NM);

      return {
        name,
        brand,
        category,
        imageUrl: null, // MFDS C005 usually doesn't provide images
        source: "mfds",
      };
    } else {
      console.log("[MFDS] Product not found.");
      return null;
    }
  } catch (error) {
    console.error("[MFDS] Network/Parse Error:", error);
    return null;
  }
}

// Helper to map Korean product names to app categories
function mapKoreanCategory(name) {
  if (!name) return "pantry";
  const str = name.trim();

  // Simple keyword matching for Korean names
  if (
    str.includes("우유") ||
    str.includes("치즈") ||
    str.includes("요거트") ||
    str.includes("버터")
  )
    return "dairy";
  if (
    str.includes("돼지") ||
    str.includes("소고기") ||
    str.includes("닭") ||
    str.includes("햄") ||
    str.includes("소시지")
  )
    return "meat";
  if (
    str.includes("사과") ||
    str.includes("바나나") ||
    str.includes("포도") ||
    str.includes("딸기") ||
    str.includes("과일")
  )
    return "fruit";
  if (
    str.includes("배추") ||
    str.includes("양파") ||
    str.includes("마늘") ||
    str.includes("채소") ||
    str.includes("샐러드")
  )
    return "vegetable";
  if (
    str.includes("냉동") ||
    str.includes("아이스크림") ||
    str.includes("만두")
  )
    return "frozen";
  if (
    str.includes("음료") ||
    str.includes("주스") ||
    str.includes("커피") ||
    str.includes("차") ||
    str.includes("콜라") ||
    str.includes("사이다")
  )
    return "drink";
  if (
    str.includes("소스") ||
    str.includes("장") ||
    str.includes("케첩") ||
    str.includes("마요네즈") ||
    str.includes("드레싱")
  )
    return "sauce";
  if (
    str.includes("과자") ||
    str.includes("초콜릿") ||
    str.includes("사탕") ||
    str.includes("스낵") ||
    str.includes("빵") ||
    str.includes("쿠키")
  )
    return "snack";

  return "pantry"; // Default fallback
}
