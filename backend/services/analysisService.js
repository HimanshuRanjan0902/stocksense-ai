
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export const analyzeStockNewsBatch = async (articles) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is missing");
  }

  if (!Array.isArray(articles) || articles.length === 0) {
    return [];
  }

  const prompt = `
You are a financial news explainer for Indian stock market investors.

Analyze each article separately.

ARTICLES:
${JSON.stringify(
  articles.map((article, index) => ({
    id: index,
    title: article.title || "Not available",
    company: article.company || "Not available",
    news: article.summary || article.long_summary || "Not available"
  }))
)}

Return ONLY valid JSON in this exact structure:
{
  "results": [
    {
      "id": 0,
      "simpleSummary": "Exactly 3 short sentences.",
      "sentiment": "positive, negative, or neutral",
      "sentimentReason": "Explain why in simple English.",
      "keyRisks": ["Risk 1", "Risk 2"],
      "impact": "low, medium, or high"
    }
  ]
}

Rules:
- Return one result for every article.
- Preserve each article's id.
- Do not invent facts.
- Mention uncertainty where appropriate.
- Do not give buy or sell recommendations.
- Base analysis only on the supplied article.
- Return valid JSON without Markdown code fences.
`;

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL,
    contents: prompt
  });

  const text = response.text.trim();
  const cleanText = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "");

  const parsed = JSON.parse(cleanText);

  if (!Array.isArray(parsed.results)) {
    throw new Error("Invalid Gemini response format");
  }

  return articles.map((article, index) => {
    const result = parsed.results.find(item => item.id === index);

    return {
      title: article.title,
      company: article.company,
      source: article.source,
      link: article.link,
      date: article.date,
      originalSentiment: article.sentiment,
      analysis: result || null
    };
  });
};
