import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAXAaUT4dS3dEwcxV_ycGIK3vgxylUKB70";

async function test() {
  const genAI = new GoogleGenerativeAI(API_KEY);
  try {
    // Verify key by listing models
    // Since SDK (0.9.0+) usually has genAI.getGenerativeModel but no direct listModels on the instance easily visible in my snippets,
    // I will use fetch directly to avoid SDK version confusion for this debug.

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      console.log("Key is VALID. Available models:");
      data.models.forEach((m) => console.log(m.name));
    } else {
      console.log(
        `Key Validity Check FAILED: ${response.status} ${response.statusText}`
      );
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Fatal:", error);
  }
}
test();
