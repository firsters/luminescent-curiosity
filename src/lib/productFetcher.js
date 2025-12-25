import { fetchProductFromOpenFoodFacts } from "./openFoodFacts";
import { fetchProductFromMFDS } from "./koreanFoodApi";

/**
 * Unified Product Fetcher
 * Strategy:
 * 1. Global (OpenFoodFacts) -> High chance for international barcodes, images available.
 * 2. Local (MFDS) -> High chance for pure Korean products, no images usually.
 */
export async function fetchProductData(barcode) {
  // 1. Try OpenFoodFacts
  const openFoodFactsResult = await fetchProductFromOpenFoodFacts(barcode);
  if (openFoodFactsResult) {
    return {
      ...openFoodFactsResult,
      source: "openfoodfacts",
    };
  }

  // 2. Try Korean MFDS (if key is configured)
  const mfdsResult = await fetchProductFromMFDS(barcode);
  if (mfdsResult) {
    return {
      ...mfdsResult,
      // Fallback for null fields if any
      imageUrl: mfdsResult.imageUrl || null,
    };
  }

  // 3. Not Found
  return null;
}
