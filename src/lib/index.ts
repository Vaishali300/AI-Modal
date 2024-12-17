/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPEN_AI_KEY!,
});

export const getAIResponse = async (prompt: any) => {
  try {
    const response: any = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error fetching data from OpenAI:", error);
    return null;
  }
};
