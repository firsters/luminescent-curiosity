/**
 * Fetches product data from Open Food Facts API
 * @param {string} barcode
 * @returns {Promise<{name: string, category: string, imageUrl: string} | null>}
 */
export async function fetchProductFromBarcode(barcode) {
  try {
    console.log(`[OpenFoodFacts] Fetching data for barcode: ${barcode}`);

    // Use V2 API which is more robust
    // fields param helps reduce data usage but we need to be careful not to exclude needed fields
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,product_name_ko,image_url,image_front_url,brands,quantity,categories_tags,code`
    );

    if (!response.ok) {
      console.warn(
        `[OpenFoodFacts] API Error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();
    console.log(`[OpenFoodFacts] Response:`, data);

    // V2 API usually returns { status: 1, product: {...} } or { status: 0, status_verbose: "product not found" }
    if (data.status === 1 && data.product) {
      const product = data.product;
      const name =
        product.product_name_ko || product.product_name || "알 수 없는 제품";
      const imageUrl = product.image_url || product.image_front_url || null;
      const category = mapCategory(product.categories_tags);

      return {
        name,
        imageUrl,
        category,
        brand: product.brands,
        quantity: product.quantity,
        raw: product, // useful for debug
      };
    } else {
      console.warn(
        `[OpenFoodFacts] Product not found. Status: ${data.status}, Verbose: ${data.status_verbose}`
      );
      return null; // Product not found
    }
  } catch (error) {
    console.error("[OpenFoodFacts] Network/Parse Error:", error);
    return null;
  }
}

function mapCategory(tags) {
  if (!tags) return "pantry";
  // simple heuristic
  const str = tags.join(" ").toLowerCase();
  if (str.includes("frozen") || str.includes("ice")) return "freezer";
  if (
    str.includes("dairy") ||
    str.includes("meat") ||
    str.includes("vegetable") ||
    str.includes("fresh")
  )
    return "fridge";
  return "pantry";
}
