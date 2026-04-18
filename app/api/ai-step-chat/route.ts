import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_MODEL = "gemini-flash-latest";
const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_MESSAGE_CHARS = 400;
const MAX_QUESTION_CHARS = 1400;

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role?: ChatRole;
  content?: string;
};

type StepFocus = {
  pattern?: string;
  step?: string;
} | null;

type MisbehaviorInput = {
  pattern?: string;
  description?: string;
  steps?: string[];
};

type ChatRequestPayload = {
  categoryTitle?: string;
  categorySubtitle?: string;
  misbehaviors?: MisbehaviorInput[];
  selectedStep?: StepFocus;
  question?: string;
  history?: ChatMessage[];
};

type SafetyRatingLike = {
  category?: string;
  blocked?: boolean;
};

function normalizeApiKey(rawKey: string | undefined): string {
  const trimmed = (rawKey || "").trim();

  if (!trimmed) {
    return "";
  }

  const unquoted = trimmed.replace(/^['\"]|['\"]$/g, "");

  return unquoted.trim();
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

function safeText(value: unknown, maxChars: number): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxChars);
}

function compactText(value: unknown, maxChars: number): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim().slice(0, maxChars);
}

function sanitizeHistory(rawHistory: unknown): Array<{
  role: ChatRole;
  content: string;
}> {
  if (!Array.isArray(rawHistory)) {
    return [];
  }

  return rawHistory
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const role = (item as ChatMessage).role;
      const content = compactText(
        (item as ChatMessage).content,
        MAX_HISTORY_MESSAGE_CHARS,
      );

      if ((role !== "user" && role !== "assistant") || !content) {
        return null;
      }

      return {
        role,
        content,
      };
    })
    .filter((item): item is { role: ChatRole; content: string } =>
      Boolean(item),
    )
    .slice(-MAX_HISTORY_MESSAGES);
}

function sanitizeStepFocus(
  rawStep: unknown,
): { pattern: string; step: string } | null {
  if (!rawStep || typeof rawStep !== "object") {
    return null;
  }

  const pattern = compactText((rawStep as StepFocus)?.pattern, 220);
  const step = safeText((rawStep as StepFocus)?.step, 400);

  if (!step) {
    return null;
  }

  return {
    pattern,
    step,
  };
}

function sanitizeMisbehaviors(rawMisbehaviors: unknown): MisbehaviorInput[] {
  if (!Array.isArray(rawMisbehaviors)) {
    return [];
  }

  const sanitized: MisbehaviorInput[] = [];

  for (const entry of rawMisbehaviors) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const pattern = compactText((entry as MisbehaviorInput).pattern, 220);
    const description = safeText((entry as MisbehaviorInput).description, 300);
    const rawSteps = (entry as MisbehaviorInput).steps;
    const steps = Array.isArray(rawSteps)
      ? rawSteps
          .map((step) => safeText(step, 260))
          .filter(Boolean)
          .slice(0, 4)
      : [];

    if (!pattern && !description && steps.length === 0) {
      continue;
    }

    sanitized.push({
      pattern,
      description,
      steps,
    });

    if (sanitized.length >= 6) {
      break;
    }
  }

  return sanitized;
}

function summarizeMisbehaviors(misbehaviors: MisbehaviorInput[]): string {
  if (misbehaviors.length === 0) {
    return "";
  }

  return misbehaviors
    .map((item, index) => {
      const parts: string[] = [];

      if (item.pattern) {
        parts.push(`Pattern: ${item.pattern}`);
      }

      if (item.description) {
        parts.push(`Context: ${item.description}`);
      }

      if (item.steps && item.steps.length > 0) {
        parts.push(
          `Plan steps: ${item.steps.map((step, stepIndex) => `${stepIndex + 1}) ${step}`).join(" ")}`,
        );
      }

      return `${index + 1}. ${parts.join(". ")}`;
    })
    .join("\n");
}

function formatHistory(
  history: Array<{ role: ChatRole; content: string }>,
): string {
  if (history.length === 0) {
    return "";
  }

  return history
    .map(
      (entry) =>
        `${entry.role === "user" ? "Owner" : "Assistant"}: ${entry.content}`,
    )
    .join("\n");
}

function buildPrompt(input: {
  categoryTitle: string;
  categorySubtitle: string;
  selectedStep: { pattern: string; step: string } | null;
  misbehaviors: MisbehaviorInput[];
  history: Array<{ role: ChatRole; content: string }>;
  question: string;
}): string {
  const summarizedMisbehaviors = summarizeMisbehaviors(input.misbehaviors);
  const historyText = formatHistory(input.history);

  return [
    "You are an expert canine behavior consultant.",
    "Use positive reinforcement and humane, fear-free methods only.",
    `Dog category: ${input.categoryTitle}.`,
    input.categorySubtitle ? `Category focus: ${input.categorySubtitle}.` : "",
    input.selectedStep?.pattern
      ? `Focused misbehavior: ${input.selectedStep.pattern}.`
      : "",
    input.selectedStep?.step ? `Focused step: ${input.selectedStep.step}` : "",
    summarizedMisbehaviors
      ? `Existing training guidance in this category:\n${summarizedMisbehaviors}`
      : "",
    historyText ? `Recent chat history:\n${historyText}` : "",
    `Owner question:\n${input.question}`,
    "",
    "Respond in plain text with:",
    "- 2 to 4 concise bullet points of practical guidance",
    "- one small 24-hour practice suggestion",
    "- one caution related to stress, health, or safety when relevant",
    "Avoid punitive tools or aversive methods.",
  ]
    .filter(Boolean)
    .join("\n");
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function extractResponseText(payload: GenerateContentResponse): string {
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

    return `Gemini blocked this request (${reason}). Try asking in simpler terms.${categories}`;
  }

  return "Gemini returned no text. Please try rephrasing the question.";
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

  let payload: ChatRequestPayload;

  try {
    payload = (await request.json()) as ChatRequestPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const question = safeText(payload.question, MAX_QUESTION_CHARS);

  if (!question) {
    return NextResponse.json(
      { error: "Please provide a question for Gemini." },
      { status: 400 },
    );
  }

  const categoryTitle =
    compactText(payload.categoryTitle, 120) || "Dog training";
  const categorySubtitle = safeText(payload.categorySubtitle, 180);
  const history = sanitizeHistory(payload.history);
  const selectedStep = sanitizeStepFocus(payload.selectedStep);
  const misbehaviors = sanitizeMisbehaviors(payload.misbehaviors);

  const prompt = buildPrompt({
    categoryTitle,
    categorySubtitle,
    selectedStep,
    misbehaviors,
    history,
    question,
  });

  const ai = new GoogleGenAI({ apiKey });
  const model = resolveGeminiModel(process.env.GEMINI_MODEL);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.4,
        maxOutputTokens: 900,
        responseMimeType: "text/plain",
      },
    });

    const reply = extractResponseText(response);

    if (!reply) {
      return NextResponse.json(
        {
          error: buildGeminiEmptyResponseMessage(response),
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      reply,
      model,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Gemini generate-content failed (${model}): ${errorMessage(error, "Gemini could not answer this question.")}`,
      },
      { status: 502 },
    );
  }
}
