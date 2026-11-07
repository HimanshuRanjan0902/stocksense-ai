
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export const analyzeStockNewsBatch = async (articles) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Groq API key is missing");
  }

  if (!Array.isArray(articles) || articles.length === 0) {
    return [];
  }

  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  const articleData = articles.map((article, index) => ({
    id: index,
    title: article.title || "",
    company: article.company || "",
    news: article.summary || article.long_summary || ""
  }));

  const prompt = `
You are a careful financial news analyst specializing in Indian stock markets.

Your task is to analyze each supplied news article independently.

STRICT FACTUAL ACCURACY RULES:

1. Analyze each article using only its own title, company name, and news content.
2. Never use information from another article when analyzing an article.
3. Never assume which company is affected by an event.
4. Never introduce a company name unless it is explicitly mentioned in that article's supplied information.
5. Never invent financial figures, dates, events, business relationships, or market reactions.
6. If the article does not provide enough information, clearly say that the information is insufficient.
7. Do not interpret general industry news as a confirmed event affecting a specific company.
8. Do not claim that a company has gained or lost money unless the article explicitly supports that statement.
9. Distinguish confirmed facts from possible implications.
10. Do not make stock price predictions or give buy/sell recommendations.

SUMMARY RULES:

- Write exactly 3 short sentences.
- Use simple English that beginners can understand.
- Explain what happened, who is affected, and why it may matter.
- Do not add information that is absent from the article.
- If the article is unclear or incomplete, mention that limitation.

SENTIMENT RULES:

- positive: The article reports a clearly favorable development.
- negative: The article reports a clearly unfavorable development.
- neutral: The article is informational, mixed, uncertain, or does not establish a clear direction.

IMPACT RULES:

- low: Limited or indirect relevance to the company.
- medium: A meaningful business or industry development.
- high: A major confirmed development with potentially significant business consequences.

KEY RISKS:
- Return up to 2 risks.
- Risks must be directly supported by the article.
- Do not create generic risks unrelated to the article.
- If no specific risk is established, return an empty array.

ARTICLES:
${JSON.stringify(articleData)}

Return ONLY valid JSON in this exact structure:

{
  "results": [
    {
      "id": 0,
      "simpleSummary": "Exactly 3 short sentences.",
      "sentiment": "positive, negative, or neutral",
      "sentimentReason": "A short explanation supported by the article.",
      "keyRisks": ["Risk 1", "Risk 2"],
      "impact": "low, medium, or high"
    }
  ]
}

FINAL VALIDATION:
- Return exactly one result for every supplied article.
- Preserve every article ID exactly.
- Do not skip or duplicate IDs.
- Do not mix facts between articles.
- Return valid JSON without Markdown code fences.
`;

  const response = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1,
    response_format: {
      type: "json_object"
    }
  });

  const text = response.choices[0]?.message?.content;

  if (!text) {
    throw new Error("Groq returned an empty response");
  }

  const parsed = JSON.parse(text);

  if (!Array.isArray(parsed.results)) {
    throw new Error("Invalid Groq response format");
  }

  return articles.map((article, index) => {
    const result = parsed.results.find(
      (item) => item.id === index
    );

    if (!result) {
      throw new Error(`Groq analysis missing for article ${index}`);
    }

    const validSentiments = ["positive", "negative", "neutral"];
    const validImpacts = ["low", "medium", "high"];

    if (
      !validSentiments.includes(result.sentiment) ||
      !validImpacts.includes(result.impact) ||
      typeof result.simpleSummary !== "string" ||
      typeof result.sentimentReason !== "string" ||
      !Array.isArray(result.keyRisks)
    ) {
      throw new Error(`Invalid analysis for article ${index}`);
    }

    return {
      title: article.title,
      company: article.company,
      source: article.source,
      link: article.link,
      date: article.date,
      originalSentiment: article.sentiment,
      analysis: result
    };
  });
};
