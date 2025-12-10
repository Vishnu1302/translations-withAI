// import { GoogleGenAI } from "@google/genai";

// // Gemini API Key from environment variable
// const geminiApiKey = "AIzaSyDZrgx3vtTTsB1rf2X-l8nff4hzq0Sfg9M";
// const ai = new GoogleGenAI({ apiKey: geminiApiKey! });

// /**
//  * Extract all strings in `value` fields from a nested JSON structure
//  */
// export function extractValuesForTranslation(obj: any): string[] {
//   const results: string[] = [];

//   function recurse(node: any) {
//     if (Array.isArray(node)) {
//       node.forEach(recurse);
//     } else if (node && typeof node === 'object') {
//       if ('value' in node && typeof node.value === 'string') {
//         results.push(node.value);
//       }
//       Object.values(node).forEach(recurse);
//     }
//   }

//   recurse(obj);
//   return results;
// }

// /**
//  * Batch translate an array of strings using Gemini API
//  */
// const translateBatchWithGemini = async (
//   texts: string[],
//   targetLocale: string
// ): Promise<string[]> => {
//   if (texts.length === 0) return [];
//   const formattedTextsForPrompt = texts.map((item, i) => {
//   let itemString;
//   if (typeof item === 'object' && item !== null) {
//     // If it's an object, stringify it to send it as a JSON string
//     itemString = JSON.stringify(item);
//   } else {
//     // Otherwise, it's a string or primitive, use as is
//     itemString = item;
//   }
//   return `${i + 1}. ${itemString}`;
// }).join("\n");

// const prompt = `
// You are a translation assistant. Translate only clear human-readable natural language text into the ${targetLocale}.

// DO NOT translate or modify any of the following types of content:
// - JSON objects that contain keys like "sys", "linkType", "nodeType", or "content"
// - Strings that look like JSON structures such as: {"sys":{...}}, {"data":{...}, "content":[...]} — preserve their structure
// - Boolean values TRUE or FALSE — keep them as-is
// - Arrays like ["Text 1", "Text 2"] — preserve structure, only translate the string contents
// - If you encounter a text similar to JSON object with nested "value" fields like for example:
//   {
//     "data": {},
//     "content": [
//       {
//         "nodeType": "paragraph",
//         "content": [
//           {
//             "nodeType": "text",
//             "value": "I agree to the "
//           },
//           {
//             "nodeType": "hyperlink",
//             "data": {
//               "uri": "/terms-and-conditions"
//             },
//             "content": [
//               {
//                 "nodeType": "text",
//                 "value": "Terms and Conditions"
//               }
//             ]
//           }
//         ]
//       }
//     ]
//   }
//   — Only translate the "value" fields. Leave everything else unchanged.

// Preserve the original formatting and structure of each input.

// Texts to translate:
// ${formattedTextsForPrompt}`

// console.log(formattedTextsForPrompt);

// //   const prompt = `
// // You are a translation assistant. Translate only clear human-readable natural language text into the target language.

// // DO NOT translate or modify any of the following types of content:
// // - JSON objects that contain keys like "sys", "linkType", "nodeType", or "content"
// // - Strings that look like JSON structures such as: {"sys":{...}}, {"data":{...}, "content":[...]} — leave these untouched
// // - Boolean values TRUE or FALSE — keep them as-is
// // - Arrays like ["Text 1", "Text 2"] — preserve structure, only translate strings inside

// // Preserve the original structure and formatting.

// // Texts to translate:
// // ${texts.map((t, i) => `${i + 1}. ${t}`).join("\n")}
// // `;

//   try {
//     const response = await ai.models.generateContent({
//       model: "gemini-2.0-flash",
//       contents: [{ role: "user", parts: [{ text: prompt }] }],
//     });

//     const raw = response.text || "";
//     const lines = raw
//       .split("\n")
//       .map((line) => line.trim())
//       .filter((line) => /^\d+\.\s+/.test(line))
//       .map((line) => line.replace(/^\d+\.\s+/, ""));

//     if (lines.length !== texts.length) {
//       console.warn("Translation count mismatch", {
//         input: texts.length,
//         translated: lines.length,
//       });
//     }

//     return lines;
//   } catch (error) {
//     console.error("Gemini batch translation error:", error);
//     return texts.map(() => ""); // fallback to empty strings
//   }
// };

// export default translateBatchWithGemini;

// // import { GoogleGenAI } from "@google/genai";

// // const geminiApiKey = "AIzaSyDZrgx3vtTTsB1rf2X-l8nff4hzq0Sfg9M";
// // const ai = new GoogleGenAI({ apiKey: geminiApiKey! });

// // export function extractValuesForTranslation(obj: any): string[] {
// //   const results: string[] = [];

// //   function recurse(node: any) {
// //     if (Array.isArray(node)) {
// //       node.forEach(recurse);
// //     } else if (node && typeof node === "object") {
// //       if (node.nodeType === "text" && typeof node.value === "string") {
// //         results.push(node.value);
// //       }
// //       Object.values(node).forEach(recurse);
// //     }
// //   }

// //   recurse(obj);
// //   return results;
// // }

// // export function applyTranslationsToRichText(richText: any, translations: string[]): any {
// //   let index = 0;

// //   function recurse(node: any): any {
// //     if (Array.isArray(node)) {
// //       return node.map(recurse);
// //     } else if (node && typeof node === "object") {
// //       const newNode = { ...node };
// //       if (newNode.nodeType === "text" && typeof newNode.value === "string") {
// //         newNode.value = translations[index++] ?? newNode.value;
// //       }
// //       Object.keys(newNode).forEach((key) => {
// //         if (typeof newNode[key] === "object") {
// //           newNode[key] = recurse(newNode[key]);
// //         }
// //       });
// //       return newNode;
// //     }
// //     return node;
// //   }

// //   return recurse(richText);
// // }

// // const translateBatchWithGemini = async (
// //   texts: string[],
// //   targetLocale: string
// // ): Promise<string[]> => {
// //   if (texts.length === 0) return [];

// //   const prompt = `
// // You are a translation assistant. Translate only clear human-readable text to ${targetLocale}.
// // Do NOT change keys or JSON structure. Only translate the text values.

// // Preserve:
// // - Formatting
// // - JSON structure
// // - Special characters
// // - HTML tags or markdown

// // Input:
// // ${texts.map((t, i) => `${i + 1}. ${t}`).join("\n")}
// // `;

// //   try {
// //     const response = await ai.models.generateContent({
// //       model: "gemini-2.0-flash",
// //       contents: [{ role: "user", parts: [{ text: prompt }] }],
// //     });

// //     const raw = response.text || "";
// //     const lines = raw
// //       .split("\n")
// //       .map((line) => line.trim())
// //       .filter((line) => /^\d+\.\s+/.test(line))
// //       .map((line) => line.replace(/^\d+\.\s+/, ""));

// //     return lines.length === texts.length ? lines : texts;
// //   } catch (error) {
// //     console.error("Gemini translation error:", error);
// //     return texts.map(() => "");
// //   }
// // };

// // export default translateBatchWithGemini;


import { GoogleGenAI } from "@google/genai";

// Gemini API Key from environment variable
const geminiApiKey = "AIzaSyCuPZLCW0l6YpiulqYIYbJhjY6Y7pmSmzw";
const ai = new GoogleGenAI({ apiKey: geminiApiKey! });

/**
 * Extract all strings in `value` fields from a nested JSON structure
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractValuesForTranslation(obj: any): string[] {
  const results: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function recurse(node: any) {
    if (Array.isArray(node)) {
      node.forEach(recurse);
    } else if (node && typeof node === 'object') {
      if ('value' in node && typeof node.value === 'string') {
        results.push(node.value);
      }
      Object.values(node).forEach(recurse);
    }
  }

  recurse(obj);
  return results;
}

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
 * Send one chunk of text to Gemini
 */
async function translateChunkWithGemini(texts: string[], targetLocale: string): Promise<string[]> {
  const formattedTextsForPrompt = texts.map((item, i) => {
    const itemString = typeof item === 'object' && item !== null
      ? JSON.stringify(item)
      : item;
    return `${i + 1}. ${itemString}`;
  }).join("\n");

  const prompt = `
You are a translation assistant. Translate only clear human-readable natural language text into the ${targetLocale}.

DO NOT translate or modify any of the following types of content:
- JSON objects with keys like "sys", "linkType", "nodeType", or "content"
- Strings that resemble JSON (e.g., {"sys":{...}})
- TRUE or FALSE — keep as-is
- Arrays like ["Text 1", "Text 2"] — only translate inner strings
- Only translate the "value" fields in rich text JSON

Preserve formatting and structure.

Texts to translate:
${formattedTextsForPrompt}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const raw = response.text || "";
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^\d+\.\s+/.test(line))
      .map((line) => line.replace(/^\d+\.\s+/, ""));

    if (lines.length !== texts.length) {
      console.warn("❗ Translation mismatch in chunk", {
        input: texts.length,
        translated: lines.length,
      });
    }

    return lines;
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
  const batchSize = 100;
  const chunks = chunkArray(texts, batchSize);

  const allTranslated: string[] = [];

  for (const [i, chunk] of chunks.entries()) {
    console.log(`🔄 Translating chunk ${i + 1}/${chunks.length} (${chunk.length} items)`);
    const translatedChunk = await translateChunkWithGemini(chunk, targetLocale);
    allTranslated.push(...translatedChunk);
  }

  if (allTranslated.length !== texts.length) {
    console.warn("❗ Final translation count mismatch", {
      input: texts.length,
      translated: allTranslated.length,
    });
  }

  return allTranslated;
};

export default translateBatchWithGemini;