
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing from .env");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export const testGemini = async () => {
  const model = process.env.GEMINI_MODEL;

  if (!model) {
    throw new Error("GEMINI_MODEL is missing from .env");
  }

  console.log("Testing Gemini model:", model);

  const response = await ai.models.generateContent({
    model,
    contents: "Explain the stock market in two simple sentences."
  });

  return response.text;
};
