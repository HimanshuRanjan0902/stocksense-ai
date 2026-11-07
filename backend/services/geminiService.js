
import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is missing from .env");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export const testGemini = async () => {
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

  console.log("Testing Groq model:", model);

  const response = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: "Explain the stock market in two simple sentences."
      }
    ],
    temperature: 0.2
  });

  return response.choices[0].message.content;
};
