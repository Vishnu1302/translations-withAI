import { GoogleGenAI } from "@google/genai";

// Gemini API Key from environment variable
const geminiApiKey = "AIzaSyDZrgx3vtTTsB1rf2X-l8nff4hzq0Sfg9M";
const ai = new GoogleGenAI({ apiKey: geminiApiKey! });

/**
 * Helper: Break array into chunks of a given size
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Send one chunk of text to Gemini for translation
 */
async function translateChunkWithGemini(texts: string[], targetLocale: string): Promise<string[]> {
  // Filter out empty or invalid texts
  const validTexts = texts.filter(text => 
    text && typeof text === 'string' && text.trim().length > 0
  );

  if (validTexts.length === 0) {
    console.warn("No valid texts to translate in this chunk");
    return texts.map(() => "");
  }

  const formattedTextsForPrompt = validTexts.map((item, i) => {
    return `${i + 1}. ${item}`;
  }).join("\n");

  const prompt = `
You are a professional translator. Translate the following text segments from English to ${targetLocale}.

IMPORTANT INSTRUCTIONS:
- Only translate natural language text
- Preserve the meaning and tone
- Keep formatting markers if any
- If a text segment is already in ${targetLocale}, return it as-is
- If a text segment contains only numbers, URLs, or technical codes, return it unchanged
- Return translations in the EXACT same order as provided
- Each translation should be on a new line, numbered exactly as provided

Text segments to translate:
${formattedTextsForPrompt}

Provide the translations in the same numbered format:`;

  try {
    console.log(`Sending ${validTexts.length} texts to Gemini for translation`);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    if (!response || !response.text) {
      console.error("Invalid response from Gemini API");
      return texts.map(() => "");
    }

    const responseText = response.text;
    console.log("Raw Gemini response:", responseText.substring(0, 200) + "...");

    if (!responseText) {
      console.error("Empty response from Gemini API");
      return texts.map(() => "");
    }

    // Parse the numbered response
    const lines = responseText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const translations: string[] = [];
    
    for (const line of lines) {
      // Look for numbered lines like "1. Translation text"
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match && match[1]) {
        translations.push(match[1].trim());
      }
    }

    console.log(`Extracted ${translations.length} translations from response`);

    // Ensure we return the same number of translations as input texts
    const result: string[] = [];
    for (let i = 0; i < texts.length; i++) {
      if (i < translations.length) {
        result.push(translations[i]);
      } else {
        result.push(texts[i]); // Fallback to original text
      }
    }

    if (result.length !== texts.length) {
      console.warn("Translation mismatch in chunk", {
        input: texts.length,
        extracted: translations.length,
        result: result.length,
      });
    }

    return result;
  } catch (error) {
    console.error("Gemini chunk translation error:", error);
    return texts.map(() => ""); // fallback empty
  }
}

/**
 * Translate an array of strings using Gemini API in safe chunks
 */
const translateBatchWithGemini = async (
  texts: string[],
  targetLocale: string
): Promise<string[]> => {
  console.log(`Starting translation of ${texts.length} texts to ${targetLocale}`);
  
  if (texts.length === 0) {
    console.log("No texts to translate");
    return [];
  }

  // Log some sample texts for debugging
  console.log("Sample texts to translate:", texts.slice(0, 3).map(t => t.substring(0, 100)));

  const batchSize = 20; // Smaller batches for better reliability
  const chunks = chunkArray(texts, batchSize);

  const allTranslated: string[] = [];

  for (const [i, chunk] of chunks.entries()) {
    console.log(`🔄 Translating chunk ${i + 1}/${chunks.length} (${chunk.length} items)`);
    
    try {
      const translatedChunk = await translateChunkWithGemini(chunk, targetLocale);
      allTranslated.push(...translatedChunk);
      
      // Small delay between chunks to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error translating chunk ${i + 1}:`, error);
      // Add empty translations for this chunk
      allTranslated.push(...chunk.map(() => ""));
    }
  }

  console.log(`✅ Translation completed. Input: ${texts.length}, Output: ${allTranslated.length}`);

  if (allTranslated.length !== texts.length) {
    console.warn("❗ Final translation count mismatch", {
      input: texts.length,
      translated: allTranslated.length,
    });
  }

  return allTranslated;
};

export default translateBatchWithGemini;