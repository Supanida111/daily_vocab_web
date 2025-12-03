// src/app/page.tsx
"use client";

import React, { useEffect, useState } from "react";

type Word = {
  id: number;
  word: string;
  definition: string | null;
  difficulty_level: string;
};

type ValidationResult = {
  score: number;
  level: string;
  suggestion: string;
  corrected_sentence: string;
};

export default function HomePage() {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [sentence, setSentence] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // โหลดคำศัพท์สุ่มตอนเปิดหน้า
  useEffect(() => {
    fetchWord();
  }, []);

  const fetchWord = async () => {
    try {
      setError(null);
      setResult(null);
      setSubmitted(false);

      const res = await fetch("http://localhost:8000/api/word");
      if (!res.ok) {
        throw new Error("Failed to load word from API");
      }
      const data: Word = await res.json();
      setCurrentWord(data);
      setSentence("");
    } catch (err: any) {
      setError(err.message || "Cannot load word");
    }
  };

  const handleSentenceChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setSentence(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(
        "http://localhost:8000/api/validate-sentence",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            word_id: currentWord.id,
            sentence: sentence,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to validate sentence");
      }

      const data: ValidationResult = await response.json();
      setResult(data);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Error while calling API");
    } finally {
      setSubmitting(false);
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold mb-2">
          Vocabulary Practice – Validate Sentence
        </h1>

        {/* แสดงคำศัพท์ปัจจุบัน */}
        {currentWord ? (
          <div className="border rounded-lg p-4 bg-slate-50 space-y-1">
            <div className="text-lg font-semibold">
              Word: <span className="text-blue-700">{currentWord.word}</span>
            </div>
            <div className="text-sm text-slate-700">
              Meaning: {currentWord.definition}
            </div>
            <div className="text-sm text-slate-500">
              Level: {currentWord.difficulty_level}
            </div>
          </div>
        ) : (
          <p>Loading word...</p>
        )}

        {/* ฟอร์มกรอกประโยค */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-medium">
            Your sentence
            <textarea
              className="mt-1 w-full border rounded-md p-2 min-h-[100px]"
              placeholder="Type your sentence here..."
              value={sentence}
              onChange={handleSentenceChange}
              disabled={!currentWord || submitting}
            />
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!currentWord || !sentence.trim() || submitting}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm disabled:bg-slate-400"
            >
              {submitting ? "Checking..." : "Validate Sentence"}
            </button>

            <button
              type="button"
              onClick={fetchWord}
              className="px-4 py-2 rounded-md bg-slate-200 text-sm"
            >
              New Word
            </button>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600">
            Error: {error}
          </p>
        )}

        {/* แสดงผลลัพธ์จาก API */}
        {submitted && result && (
          <div className="mt-4 border-t pt-4 space-y-2">
            <div className={`text-lg font-semibold ${scoreColor(result.score)}`}>
              Score: {result.score.toFixed(1)} / 10 ({result.level})
            </div>
            <div className="text-sm">
              <span className="font-medium">Suggestion:</span>{" "}
              {result.suggestion}
            </div>
            <div className="text-sm">
              <span className="font-medium">Corrected sentence:</span>{" "}
              {result.corrected_sentence}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
