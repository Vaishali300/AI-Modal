"use client";
import { useState } from "react";

type Question = {
  id: number;
  question: string;
};

type Response = {
  totalQuestions: number;
  accurateCount: number;
  percentageCorrect: number;
  answersComparison: {
    questionId: string;
    userAnswer: string;
    aiAnswer: string;
    scoreOutOfTen: number;
  }[];
};

const questions: Question[] = [
  { id: 1, question: "What is ReactJS?" },
  { id: 2, question: "Explain props and state in React with differences?" },
  { id: 3, question: "What is tsx?" },
  { id: 4, question: "What is Virtual DOM?" },
  { id: 5, question: "What is higher-order component in React?" },
];

const QuestionAndAnswer = () => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [response, setResponse] = useState<Response | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null); // Error state

  const handleAnswerChange = (id: number, answer: string) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [id]: answer,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null); // Reset the error before submitting

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(answers),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response. Please try again.");
      }

      const res = await response.json();
      setResponse(res);
    } catch (error) {
      console.error("Error evaluating answers:", error);
      setError("An error occurred while fetching results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasDisabled = questions.every(
    (q) => answers[q.id] && answers[q.id].trim() !== ""
  );

  const isAnswerCorrect = (userAnswer: string, aiAnswer: string) =>
    userAnswer.trim().toLowerCase() === aiAnswer.trim().toLowerCase();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <h1 className="text-2xl sm:text-3xl font-semibold text-center mb-6">
        Question & Answer
      </h1>
      <form>
        <div className="space-y-6">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className="bg-gray-100 p-4 sm:p-6 rounded-lg shadow-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <p className="text-lg font-medium sm:w-10">Q {index + 1}.</p>
                <p className="mx-2 text-lg sm:text-base">{q.question}</p>
              </div>
              <input
                type="text"
                className="mt-3 p-3 sm:p-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={answers[q.id] || ""}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                placeholder="Your answer"
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center mt-8">
          {error && <p className="text-red-500 mb-4 font-semibold">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={!hasDisabled || loading}
            className={`${
              !hasDisabled || loading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white font-semibold py-3 px-6 rounded-lg shadow-md focus:outline-none transition-all duration-300`}
          >
            {loading ? "Loading..." : "Submit"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="absolute inset-0 bg-white bg-opacity-10 flex justify-center items-center z-50">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        response && (
          <div className="mt-10 bg-white p-4 sm:p-6 rounded-lg shadow-lg">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">
              Your Results
            </h2>
            <div className="space-y-4">
              {response.answersComparison.map((comparison, index) => {
                const isCorrect = isAnswerCorrect(
                  comparison.userAnswer,
                  comparison.aiAnswer
                );
                return (
                  <div key={index} className="border-b pb-4">
                    <p className="font-medium mb-2">
                      Question {comparison.questionId}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="font-semibold text-sm text-gray-700">
                          Your Answer:
                        </div>
                        <p
                          className={`text-sm ${
                            isCorrect ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {comparison.userAnswer}
                        </p>
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-gray-700">
                          AI Answer:
                        </div>
                        <p className="text-gray-900">{comparison.aiAnswer}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Score: {comparison.scoreOutOfTen} / 10
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <div className="text-lg font-semibold">
                Total Score:{" "}
                {response.answersComparison.reduce(
                  (acc, cur) => acc + cur.scoreOutOfTen,
                  0
                )}{" "}
                / {response.answersComparison.length * 10}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default QuestionAndAnswer;
