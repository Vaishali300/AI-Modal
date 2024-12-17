/* eslint-disable prefer-const */
import { NextApiRequest, NextApiResponse } from "next";
import { getAIResponse } from "@/lib"; // Function to generate AI answers
import * as fuzzball from "fuzzball";
// import * as spellchecker from "spellchecker"; // Add spellchecker for fixing minor typos (optional)

// Utility: Normalize answers for comparison
const normalizeAnswer = (answer: string): string => {
  return answer
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove non-word characters
    .replace(/\s+/g, " "); // Normalize multiple spaces
};

// Optional: Spellchecker to fix minor typos
const correctSpelling = (answer: string): string => {
  // If you decide to use spellchecker, uncomment the lines below
  // const corrections = spellchecker.isMisspelled(answer);
  // return corrections ? spellchecker.getCorrections(answer) : answer;
  return answer; // Placeholder for now, without spellchecking
};

// Fuzzy match score (scaled to 10)
const calculateAccuracyScore = (
  userAnswer: string,
  aiAnswer: string
): number => {
  const score = fuzzball.ratio(
    normalizeAnswer(userAnswer),
    normalizeAnswer(aiAnswer)
  );

  // Adjust the score threshold if necessary
  return Math.round((score / 100) * 10);
};

// API Route Handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Extract data (user answers or questions+answers)
    const userData: {
      [key: string]: { question?: string; userAnswer: string };
    } = req.body;

    if (!userData || Object.keys(userData).length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid input: User answers are required." });
    }

    let totalQuestions = Object.keys(userData).length;

    let answersComparison: {
      questionId: string;
      question?: string;
      userAnswer: string;
      aiAnswer: string;
      scoreOutOfTen: number;
    }[] = [];

    for (const [key, value] of Object.entries(userData)) {
      let userAnswer: string;
      let question: string | undefined;

      if (typeof value === "string") {
        userAnswer = value;
      } else {
        userAnswer = value.userAnswer;
        question = value.question;
      }

      userAnswer = correctSpelling(userAnswer);

      let aiAnswer = await getAIResponse(
        question ? `${question} ${userAnswer}` : userAnswer
      ).catch((err) => {
        console.error(`Error generating AI response for question ${key}:`, err);
        return "";
      });

      if (!aiAnswer) {
        console.warn(`AI failed to respond for question ${key}`);
        continue;
      }

      const score = calculateAccuracyScore(userAnswer, aiAnswer);

      answersComparison.push({
        questionId: key,
        question,
        userAnswer,
        aiAnswer,
        scoreOutOfTen: score,
      });
    }

    return res.status(200).json({
      totalQuestions,

      answersComparison,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
}
