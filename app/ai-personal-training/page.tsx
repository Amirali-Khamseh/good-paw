"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BrainCircuit,
  LoaderCircle,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";

const MAX_VIDEO_SIZE_MB = 200;

type AnalyzeResponse = {
  plan?: string;
  error?: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function stripMarkdownSyntax(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n");

  const cleaned = normalized
    // Remove fenced code block markers while keeping inner text.
    .replace(/^```[\w-]*\s*$/gm, "")
    .replace(/^```\s*$/gm, "")
    // Remove headings and quote prefixes.
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    // Remove list prefixes while preserving content.
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*(\d+)\.\s+/gm, "$1) ")
    // Remove common inline markdown formatting.
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "");

  return cleaned
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function AiPersonalTrainingPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState("");

  function getFileError(file: File | null): string {
    if (!file) {
      return "Please upload a dog behavior video first.";
    }

    if (!file.type.startsWith("video/")) {
      return "Please upload a valid video file.";
    }

    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      return `Video is too large. Please upload up to ${MAX_VIDEO_SIZE_MB} MB.`;
    }

    return "";
  }

  function handlePickedFile(file: File | null) {
    setError("");
    setPlan("");
    setHasSubmitted(false);

    if (!file) {
      setVideoFile(null);
      return;
    }

    const fileError = getFileError(file);

    if (fileError) {
      setVideoFile(null);
      setError(fileError);
      return;
    }

    setVideoFile(file);
  }

  const fileDetails = useMemo(() => {
    if (!videoFile) {
      return "No file selected";
    }

    return `${videoFile.name} (${formatFileSize(videoFile.size)})`;
  }, [videoFile]);

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPlan("");

    const selectedVideo = videoFile;
    const fileError = getFileError(selectedVideo);
    if (fileError) {
      setError(fileError);
      return;
    }

    if (!selectedVideo) {
      setError("Please upload a dog behavior video first.");
      return;
    }

    const formData = new FormData();
    formData.append("video", selectedVideo);
    formData.append("notes", notes.trim());

    setHasSubmitted(true);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ai-training-plan", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as AnalyzeResponse;

      if (!response.ok) {
        setError(data.error ?? "Could not analyze the video right now.");
        return;
      }

      if (!data.plan) {
        setError("The AI did not return a training plan.");
        return;
      }

      const cleanedPlan = stripMarkdownSyntax(data.plan);

      setPlan(cleanedPlan || data.plan);
    } catch {
      setError("Network error while contacting the AI service.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FFFBF1] px-4 py-10 text-[#3B2A2A] sm:px-6 sm:py-14">
      <section className="relative mx-auto mb-6 max-w-6xl overflow-hidden rounded-[2rem] bg-[#FFF2D0] px-6 py-10 sm:px-10 sm:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#FFB2B2_0%,#FFF2D0_42%,#FFFBF1_100%)]" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E36A6A]/25 bg-[#FFFBF1] px-4 py-2 text-sm font-semibold text-[#E36A6A]">
            <BrainCircuit className="size-4" />
            Gemini Behavior Analysis
          </div>
          <h1 className="mt-5 font-heading text-3xl leading-tight tracking-tight text-[#5A3333] sm:text-5xl">
            Upload a dog behavior video and get a step-by-step resolution plan.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#6F4545] sm:text-lg">
            The AI reviews the video context and returns a practical training
            sequence you can apply day by day.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#FFB2B2] px-4 py-2 text-sm font-semibold text-[#5A3333] transition-colors hover:bg-[#E36A6A] hover:text-[#FFFBF1]"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </div>
      </section>

      <section
        className={`mx-auto grid max-w-6xl gap-5 ${
          hasSubmitted ? "lg:grid-cols-[0.95fr_1.05fr]" : "lg:grid-cols-1"
        }`}
      >
        <form
          onSubmit={handleAnalyze}
          className="rounded-[1.55rem] border border-[#E36A6A]/20 bg-[#FFF2D0] p-5 sm:p-6"
        >
          <p className="text-lg font-semibold text-[#5A3333]">Video input</p>
          <p className="mt-1 text-sm text-[#6B4C4C]">
            Supported: MP4, MOV, WEBM. Max {MAX_VIDEO_SIZE_MB} MB.
          </p>

          <label
            className={`mt-4 flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-8 text-sm font-medium text-[#5A3333] transition-colors ${
              isDragging
                ? "border-[#E36A6A] bg-[#FFB2B2]/35"
                : "border-[#E36A6A]/35 bg-[#FFFBF1] hover:border-[#E36A6A]"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              const droppedFile = event.dataTransfer.files?.[0] ?? null;
              handlePickedFile(droppedFile);
            }}
          >
            <Upload className="size-5 text-[#E36A6A]" />
            <span>Drag and drop behavior video here</span>
            <span className="text-xs text-[#7A5A5A]">
              or click to browse files
            </span>
            <input
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                handlePickedFile(nextFile);
              }}
            />
          </label>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#FFFBF1] px-3 py-2 text-xs font-medium text-[#5F4A4A]">
            <Video className="size-4 text-[#E36A6A]" />
            {fileDetails}
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-[#5A3333]">
              Extra context (optional)
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Example: barking at visitors, pulling leash on walks, gets worse in the evening..."
              className="mt-2 min-h-28 w-full rounded-xl border border-[#E36A6A]/25 bg-[#FFFBF1] px-3 py-2 text-sm text-[#5A3333] outline-none placeholder:text-[#8B6C6C] focus:border-[#E36A6A]"
            />
          </label>

          {error ? (
            <p className="mt-3 rounded-xl bg-[#FFB2B2]/60 px-3 py-2 text-sm font-medium text-[#5A3333]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E36A6A] px-4 py-2.5 text-sm font-semibold text-[#FFFBF1] transition-colors hover:bg-[#cc5959] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Analyzing video with Gemini...
              </>
            ) : (
              "Generate step-by-step plan"
            )}
          </button>
        </form>

        {hasSubmitted ? (
          <section className="rounded-[1.55rem] border border-[#E36A6A]/20 bg-[#FFF2D0] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <p className="text-lg font-semibold text-[#5A3333]">
                AI training plan
              </p>
            </div>

            {isSubmitting ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#FFFBF1] p-4 text-sm font-medium text-[#6B4C4C]">
                <LoaderCircle className="size-4 animate-spin text-[#E36A6A]" />
                Gemini is analyzing the video and generating your plan...
              </div>
            ) : null}

            {!isSubmitting && plan ? (
              <div className="mt-4 rounded-xl bg-[#FFFBF1] p-4">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#4E3E3E]">
                  {plan}
                </pre>
              </div>
            ) : null}

            {!isSubmitting && !plan && error ? (
              <div className="mt-4 rounded-xl bg-[#FFB2B2]/60 p-4 text-sm font-medium text-[#5A3333]">
                {error}
              </div>
            ) : null}

            {!isSubmitting && !plan && !error ? (
              <div className="mt-4 rounded-xl bg-[#FFFBF1] p-4 text-sm leading-relaxed text-[#6B4C4C]">
                <Sparkles className="mb-2 size-4 text-[#E36A6A]" />
                Your step-by-step plan will appear here after submission.
              </div>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}
