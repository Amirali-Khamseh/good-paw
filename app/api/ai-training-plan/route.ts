import {
  FileState,
  GoogleGenAI,
  createPartFromUri,
  type File as GeminiFile,
  type GenerateContentResponse,
} from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_MODEL = "gemini-flash-latest";
const DEFAULT_MAX_VIDEO_SIZE_MB = 200;
const FILE_READY_MAX_CHECKS = 30;
const FILE_READY_POLL_MS = 2000;

type SafetyRatingLike = {
  category?: string;
  blocked?: boolean;
};

function normalizeApiKey(rawKey: string | undefined): string {
  const trimmed = (rawKey || "").trim();

  if (!trimmed) {
    return "";
  }

  // Guard against accidental quoted values in .env files.
  const unquoted = trimmed.replace(/^['\"]|['\"]$/g, "");

  return unquoted.trim();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMaxVideoSizeMb(): number {
  const envValue = process.env.MAX_VIDEO_SIZE_MB;

  if (!envValue) {
    return DEFAULT_MAX_VIDEO_SIZE_MB;
  }

  const parsed = Number(envValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_VIDEO_SIZE_MB;
  }

  return Math.floor(parsed);
}

function resolveGeminiModel(rawModel: string | undefined): string {
  const candidate = (rawModel || "").trim();

  if (!candidate) {
    return DEFAULT_MODEL;
  }

  const normalized = candidate.replace(/^models\//, "");
  const lowered = normalized.toLowerCase();

  if (
    lowered === "flash" ||
    lowered === "gemini-flash" ||
    lowered === "gemini flash" ||
    lowered === "gemini-flash-latest"
  ) {
    return "gemini-flash-latest";
  }

  // Allow short user input while keeping valid model IDs.
  if (
    lowered === "3" ||
    lowered === "3-pro" ||
    lowered === "3 pro" ||
    lowered === "gemini-3" ||
    lowered === "gemini 3" ||
    lowered === "gemini-3-pro" ||
    lowered === "gemini 3 pro"
  ) {
    return "gemini-3-pro";
  }

  if (
    lowered === "3.1" ||
    lowered === "gemini-3.1" ||
    lowered === "gemini-3.1-flash"
  ) {
    return "gemini-3.1-flash";
  }

  return normalized;
}

function buildPrompt(ownerNotes: string): string {
  return [
    "You are an expert canine behavior consultant.",
    "Analyze the uploaded dog behavior video and produce a practical plan.",
    ownerNotes ? `Owner notes: ${ownerNotes}` : "Owner notes: none provided.",
    "",
    "Return Markdown with these exact sections:",
    "1) Behavior Summary",
    "2) Likely Triggers",
    "3) Step-by-Step Resolution Plan",
    "4) 7-Day Practice Schedule",
    "5) Safety Notes",
    "6) When to Seek a Vet or Trainer",
    "",
    "Rules:",
    "- Use positive reinforcement and humane methods only.",
    "- Keep steps specific, concise, and actionable.",
    "- If the video is unclear, state assumptions briefly.",
  ].join("\n");
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function normalizeFileState(state: FileState | string | undefined): string {
  if (typeof state === "string") {
    return state.toUpperCase();
  }

  return FileState.STATE_UNSPECIFIED;
}

function extractPlanText(payload: GenerateContentResponse): string {
  const directText = (payload.text || "").trim();
  if (directText) {
    return directText;
  }

  const candidates = payload.candidates ?? [];

  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? [];
    const text = parts
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("\n")
      .trim();

    if (text) {
      return text;
    }
  }

  return "";
}

function formatBlockedSafetyCategories(
  ratings: SafetyRatingLike[] | undefined,
): string {
  const categories = Array.from(
    new Set(
      (ratings ?? [])
        .filter((rating) => rating.blocked)
        .map((rating) => (rating.category || "").trim())
        .filter(Boolean),
    ),
  );

  if (categories.length === 0) {
    return "";
  }

  return ` Blocked categories: ${categories.join(", ")}.`;
}

function buildGeminiEmptyResponseMessage(
  payload: GenerateContentResponse,
): string {
  const promptFeedback = payload.promptFeedback;
  const blockReason = String(promptFeedback?.blockReason ?? "").trim();
  const blockReasonMessage = String(
    promptFeedback?.blockReasonMessage ?? "",
  ).trim();

  if (blockReason || blockReasonMessage) {
    const reason = blockReasonMessage || blockReason;
    const categories = formatBlockedSafetyCategories(
      promptFeedback?.safetyRatings as SafetyRatingLike[] | undefined,
    );

    return `Gemini blocked this request (${reason}). Try a shorter, clearer video or adjust the notes.${categories}`;
  }

  const candidates = payload.candidates ?? [];
  if (candidates.length === 0) {
    return "Gemini returned no candidates. Try a shorter clip and retry.";
  }

  const firstFinishReason =
    candidates
      .map((candidate) => String(candidate.finishReason ?? "").trim())
      .find(Boolean) || "";

  if (firstFinishReason === "SAFETY") {
    const categories = formatBlockedSafetyCategories(
      candidates[0]?.safetyRatings as SafetyRatingLike[] | undefined,
    );

    return `Gemini stopped due to safety filters. Try a shorter, clearer clip or neutral notes.${categories}`;
  }

  if (firstFinishReason === "MAX_TOKENS") {
    return "Gemini reached its output token limit before returning text. Try a shorter clip and retry.";
  }

  if (firstFinishReason === "RECITATION") {
    return "Gemini stopped due to recitation safeguards. Try a different clip or add more context in notes.";
  }

  if (firstFinishReason) {
    return `Gemini returned no text (finish reason: ${firstFinishReason}). Try a different clip and retry.`;
  }

  return "Gemini returned no text for this video. Try a shorter, clearer clip and retry.";
}

async function uploadFileToGemini(
  ai: GoogleGenAI,
  video: File,
): Promise<GeminiFile> {
  try {
    return await ai.files.upload({
      file: video,
      config: {
        mimeType: video.type || "video/mp4",
        displayName: video.name || "dog-behavior-video",
      },
    });
  } catch (error) {
    throw new Error(
      `Gemini upload failed: ${errorMessage(error, "Failed to upload video.")}`,
    );
  }
}

async function waitUntilGeminiFileReady(
  ai: GoogleGenAI,
  fileName: string,
): Promise<GeminiFile> {
  for (let i = 0; i < FILE_READY_MAX_CHECKS; i += 1) {
    let file: GeminiFile;

    try {
      file = await ai.files.get({ name: fileName });
    } catch (error) {
      throw new Error(
        `Gemini file-status failed: ${errorMessage(error, "Could not read Gemini file status.")}`,
      );
    }

    const state = normalizeFileState(file.state);

    if (state === FileState.ACTIVE) {
      return file;
    }

    if (state === FileState.FAILED) {
      throw new Error(
        file.error?.message ?? "Gemini failed to process uploaded video.",
      );
    }

    await sleep(FILE_READY_POLL_MS);
  }

  throw new Error("Video processing timed out. Try a shorter clip or retry.");
}

async function deleteGeminiFile(
  ai: GoogleGenAI,
  fileName: string,
): Promise<void> {
  try {
    await ai.files.delete({ name: fileName });
  } catch {
    // Best-effort cleanup.
  }
}

export async function POST(request: Request) {
  const apiKey = normalizeApiKey(process.env.GEMINI_API_KEY);

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Server is missing GEMINI_API_KEY. Add it in your .env file and restart dev server.",
      },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const video = formData.get("video");
  const notesValue = formData.get("notes");
  const ownerNotes = typeof notesValue === "string" ? notesValue.trim() : "";

  if (!(video instanceof File)) {
    return NextResponse.json(
      { error: "Please upload a video file." },
      { status: 400 },
    );
  }

  if (!video.type.startsWith("video/")) {
    return NextResponse.json(
      { error: "The uploaded file is not a valid video." },
      { status: 400 },
    );
  }

  if (video.size === 0) {
    return NextResponse.json(
      { error: "Uploaded video is empty." },
      { status: 400 },
    );
  }

  const maxVideoSizeMb = getMaxVideoSizeMb();
  const maxVideoSizeBytes = maxVideoSizeMb * 1024 * 1024;

  if (video.size > maxVideoSizeBytes) {
    return NextResponse.json(
      {
        error: `Video is too large. Maximum supported size is ${maxVideoSizeMb} MB.`,
      },
      { status: 413 },
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = resolveGeminiModel(process.env.GEMINI_MODEL);

  let uploadedFileName: string | null = null;

  try {
    const uploadedFile = await uploadFileToGemini(ai, video);
    uploadedFileName = uploadedFile.name ?? null;

    if (!uploadedFileName) {
      return NextResponse.json(
        { error: "Gemini did not return an uploaded file name." },
        { status: 502 },
      );
    }

    const readyFile = await waitUntilGeminiFileReady(ai, uploadedFileName);
    const fileUri = readyFile.uri ?? uploadedFile.uri;
    const mimeType = readyFile.mimeType ?? uploadedFile.mimeType ?? video.type;

    if (!fileUri || !mimeType) {
      return NextResponse.json(
        { error: "Gemini did not return a usable uploaded file reference." },
        { status: 502 },
      );
    }

    let response: GenerateContentResponse;

    try {
      response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { text: buildPrompt(ownerNotes) },
              createPartFromUri(fileUri, mimeType),
            ],
          },
        ],
        config: {
          temperature: 0.3,
          maxOutputTokens: 1800,
          responseMimeType: "text/plain",
        },
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: `Gemini generate-content failed (${model}): ${errorMessage(error, "Gemini could not analyze this video.")}`,
        },
        { status: 502 },
      );
    }

    const plan = extractPlanText(response);

    if (!plan) {
      return NextResponse.json(
        { error: buildGeminiEmptyResponseMessage(response) },
        { status: 502 },
      );
    }

    return NextResponse.json({
      plan,
      model,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: errorMessage(error, "Could not process the uploaded video."),
      },
      { status: 502 },
    );
  } finally {
    if (uploadedFileName) {
      await deleteGeminiFile(ai, uploadedFileName);
    }
  }
}
