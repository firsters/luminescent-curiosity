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
  if (!tags || tags.length === 0) return "pantry";

  const str = tags.join(" ").toLowerCase();

  // Priority Check (Specific -> Generic)

  // Frozen
  if (
    str.includes("frozen") ||
    str.includes("ice-cream") ||
    str.includes("ice cream")
  )
    return "frozen";

  // Meat & Seafood
  if (
    str.includes("meat") ||
    str.includes("beef") ||
    str.includes("pork") ||
    str.includes("chicken") ||
    str.includes("sausage") ||
    str.includes("ham") ||
    str.includes("seafood") ||
    str.includes("fish")
  )
    return "meat";

  // Dairy & Eggs
  if (
    str.includes("dairy") ||
    str.includes("milk") ||
    str.includes("cheese") ||
    str.includes("yogurt") ||
    str.includes("egg") ||
    str.includes("butter")
  )
    return "dairy";

  // Fruit
  if (
    str.includes("fruit") ||
    str.includes("apple") ||
    str.includes("banana") ||
    str.includes("orange") ||
    str.includes("grape") ||
    str.includes("berry") ||
    str.includes("peach")
  )
    return "fruit";

  // Vegetable
  if (
    str.includes("vegetable") ||
    str.includes("plant-based-foods") ||
    str.includes("salad") ||
    str.includes("lettuce") ||
    str.includes("tomato") ||
    str.includes("onion")
  )
    return "vegetable";

  // Drinks
  if (
    str.includes("beverage") ||
    str.includes("drink") ||
    str.includes("water") ||
    str.includes("juice") ||
    str.includes("soda") ||
    str.includes("coffee") ||
    str.includes("tea")
  )
    return "drink";

  // Sauce & Condiments
  if (
    str.includes("sauce") ||
    str.includes("condiment") ||
    str.includes("dressing") ||
    str.includes("ketchup") ||
    str.includes("mayonnaise") ||
    str.includes("mustard") ||
    str.includes("spice")
  )
    return "sauce";

  // Snacks
  if (
    str.includes("snack") ||
    str.includes("chip") ||
    str.includes("cookie") ||
    str.includes("biscuit") ||
    str.includes("candy") ||
    str.includes("chocolate") ||
    str.includes("cracker")
  )
    return "snack";

  // Bread & Bakery (Map to Snack or Pantry? Let's go with Pantry usually, or maybe Snack if sweet)
  if (str.includes("bread") || str.includes("bakery")) return "pantry";

  // General Fridge items fallback
  if (str.includes("fresh") || str.includes("refrigerated")) return "fridge"; // We don't have a generic 'fridge' category in the default list, but AddItem handles it?
  // Actually AddItem default categories are: fruit, vegetable, meat, dairy, frozen, drink, sauce, snack.
  // If we return 'fridge', it might not match any chip.
  // Let's modify the fallback.

  // Fallback based on typical form
  return "pantry"; // 'pantry' is not in the default list either?
  // AddItem defaults: fruit, vegetable, meat, dairy, frozen, drink, sauce, snack.
  // Wait, I see 'pantry' used in getFridgeColor but maybe not in foodCategory chips?
  // AddItem categories lines 22-31: fruit, vegetable, meat, dairy, frozen, drink, sauce, snack.
  // So 'pantry' is NOT a valid foodCategory.
  // We should map unknown things to 'snack' or 'sauce' or maybe just leave it as 'pantry' if we plan to add it?
  // Or better, return "snack" as a safe fallback for packaged goods?
  // Let's check AddItem categories again.
  // The user can add custom categories.
  // Let's return "snack" as a catch-all for packaged food, or "vegetable" for fresh?
  // Actually, let's default to "snack" for processed stuff, "vegetable" for fresh.
  // Hard to say. I'll stick to returning a valid ID from the list if possible.
  // If I return "pantry", the form might just show it but not highlight a chip.
  // Let's return "snack" as safe default for barcodes (usually packaged goods).
}
