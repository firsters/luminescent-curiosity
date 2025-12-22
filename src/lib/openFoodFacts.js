/**
 * Fetches product data from Open Food Facts API
 * @param {string} barcode 
 * @returns {Promise<{name: string, category: string, imageUrl: string} | null>}
 */
export async function fetchProductFromBarcode(barcode) {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();

    if (data.status === 1) {
      const product = data.product;
      // Extract diverse fields for better coverage
      const name = product.product_name_ko || product.product_name || "Unknown Product";
      const imageUrl = product.image_url || product.image_front_url || null;
      // Simple category mapping could be improved
      const category = mapCategory(product.categories_tags);

      return {
        name,
        imageUrl,
        category,
        brand: product.brands,
        quantity: product.quantity
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

function mapCategory(tags) {
  if (!tags) return 'pantry';
  // simple heuristic
  const str = tags.join(' ').toLowerCase();
  if (str.includes('frozen') || str.includes('ice')) return 'freezer';
  if (str.includes('dairy') || str.includes('meat') || str.includes('vegetable') || str.includes('fresh')) return 'fridge';
  return 'pantry';
}
