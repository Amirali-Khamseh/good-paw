"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Dumbbell,
  LoaderCircle,
  MessageCircle,
  SendHorizonal,
  Sparkles,
} from "lucide-react";

type Misbehavior = {
  pattern: string;
  description: string;
  steps: string[];
};

type TrainingCategory = {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  misbehaviors: Misbehavior[];
};

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type StepFocus = {
  pattern: string;
  step: string;
} | null;

type AskGeminiResponse = {
  reply?: string;
  error?: string;
};

const MAX_CHAT_HISTORY_MESSAGES = 8;

const categories: TrainingCategory[] = [
  {
    title: "Puppies (2-8 months)",
    subtitle: "Foundation routines and impulse control",
    imageSrc: "/training/puppies.svg",
    imageAlt: "Puppy category illustration",
    misbehaviors: [
      {
        pattern: "Nipping hands and clothes during play",
        description:
          "Puppies explore with their mouths, but nipping becomes a habit if play continues after biting.",
        steps: [
          "Keep a soft toy in reach and redirect teeth to that toy each time.",
          "Pause play for 20-30 seconds when teeth touch skin.",
          "Reward calm mouth behavior before restarting play.",
        ],
      },
      {
        pattern: "Potty accidents from inconsistent schedule",
        description:
          "Accidents usually happen when the puppy has too much free time without bathroom breaks.",
        steps: [
          "Take the puppy out after sleep, meals, play, and every 2-3 hours.",
          "Use one potty area and quietly wait for success.",
          "Reward immediately after elimination, not after returning indoors.",
        ],
      },
      {
        pattern: "Chewing shoes, wires, and random objects",
        description:
          "Chewing rises during teething and boredom, so management plus redirection is essential.",
        steps: [
          "Limit unsupervised roaming with a crate or puppy pen.",
          "Rotate safe chew options to keep novelty high.",
          "Interrupt calmly, swap for a legal chew, and reward the swap.",
        ],
      },
    ],
  },
  {
    title: "Adolescent Dogs (8-24 months)",
    subtitle: "High energy and boundary testing",
    imageSrc: "/training/adolescent.svg",
    imageAlt: "Adolescent dog category illustration",
    misbehaviors: [
      {
        pattern: "Leash pulling and weak recall",
        description:
          "Adolescent dogs are easily distracted, so they need very short reps with fast rewards.",
        steps: [
          "Start each walk with 60-90 seconds of focus cues near home.",
          "Reward walking beside your leg every few steps at first.",
          "Practice recall indoors daily before trying it around distractions.",
        ],
      },
      {
        pattern: "Jumping on guests at the door",
        description:
          "Jumping works for the dog if attention arrives quickly, so greeting rules must stay consistent.",
        steps: [
          "Ask for a sit before opening the door.",
          "If jumping starts, guests turn away and remove attention.",
          "Allow greeting only when all four paws stay on the floor.",
        ],
      },
      {
        pattern: "Demand barking for attention",
        description:
          "Dogs repeat barking when it reliably gets food, play, or eye contact.",
        steps: [
          "Do not reward barking with attention or toys.",
          "Mark and reward brief quiet moments right away.",
          "Add planned enrichment sessions so needs are met proactively.",
        ],
      },
    ],
  },
  {
    title: "Rescue or Anxious Dogs",
    subtitle: "Confidence building and emotional safety",
    imageSrc: "/training/rescue.svg",
    imageAlt: "Rescue or anxious dog category illustration",
    misbehaviors: [
      {
        pattern: "Hiding, freezing, or shutdown behavior",
        description:
          "When stress is high, learning drops. Safety and predictability come before obedience drills.",
        steps: [
          "Set up a quiet safe zone and avoid forcing social interactions.",
          "Use a fixed routine for meals, walks, and rest.",
          "Reward any voluntary approach or curiosity without pressure.",
        ],
      },
      {
        pattern: "Reactivity to people, dogs, or sudden sounds",
        description:
          "Reactivity improves when triggers are paired with reward at a safe distance below threshold.",
        steps: [
          "Increase distance until your dog can notice the trigger calmly.",
          "Feed high-value treats while the trigger is visible.",
          "End the session before stress builds, then repeat with tiny progress.",
        ],
      },
      {
        pattern: "Destructive behavior when left alone",
        description:
          "Separation distress requires gradual alone-time training rather than long absences too soon.",
        steps: [
          "Practice departures in seconds, not minutes, at first.",
          "Use a predictable pre-departure cue and calm return.",
          "Increase duration slowly only when the previous level is relaxed.",
        ],
      },
    ],
  },
  {
    title: "Senior Dogs",
    subtitle: "Comfort-first training and gentle structure",
    imageSrc: "/training/senior.svg",
    imageAlt: "Senior dog category illustration",
    misbehaviors: [
      {
        pattern: "Night restlessness and pacing",
        description:
          "Sleep disruption can be linked to discomfort, cognitive decline, or low daytime enrichment.",
        steps: [
          "Book a vet check to evaluate pain and age-related conditions.",
          "Use short daytime sniff walks and gentle brain games.",
          "Keep bedtime cues consistent: potty, calm lights, then sleep area.",
        ],
      },
      {
        pattern: "House-soiling after routine changes",
        description:
          "Senior dogs often need more frequent bathroom breaks and stable timing.",
        steps: [
          "Increase potty frequency, especially after naps and meals.",
          "Return to rewarding successful outdoor elimination.",
          "Track accident timing and adjust the schedule around patterns.",
        ],
      },
      {
        pattern: "Irritability from pain or sensory decline",
        description:
          "Unexpected touch or startle can trigger growling in older dogs with discomfort.",
        steps: [
          "Approach from the front and use verbal cues before touch.",
          "Give rest zones where children and other pets do not disturb.",
          "Use reward-based handling and avoid physically forcing movement.",
        ],
      },
    ],
  },
];

function buildCategoryWelcomeMessage(categoryTitle: string): ChatMessage {
  return {
    role: "assistant",
    content: `Ask anything about ${categoryTitle}. I can explain a step, simplify it, or tailor it to your dog's age and temperament.`,
  };
}

function stripMarkdownSyntax(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n");

  return normalized
    .replace(/^```[\w-]*\s*$/gm, "")
    .replace(/^```\s*$/gm, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*(\d+)\.\s+/gm, "$1) ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function TrainingPage() {
  const [chatOpenByCategory, setChatOpenByCategory] = useState<
    Record<string, boolean>
  >({});
  const [chatMessagesByCategory, setChatMessagesByCategory] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [chatDraftByCategory, setChatDraftByCategory] = useState<
    Record<string, string>
  >({});
  const [chatErrorByCategory, setChatErrorByCategory] = useState<
    Record<string, string>
  >({});
  const [chatLoadingByCategory, setChatLoadingByCategory] = useState<
    Record<string, boolean>
  >({});
  const [focusedStepByCategory, setFocusedStepByCategory] = useState<
    Record<string, StepFocus>
  >({});

  function ensureCategoryChatBootstrap(category: TrainingCategory) {
    setChatMessagesByCategory((prev) => {
      if (prev[category.title]) {
        return prev;
      }

      return {
        ...prev,
        [category.title]: [buildCategoryWelcomeMessage(category.title)],
      };
    });
  }

  function toggleCategoryChat(category: TrainingCategory) {
    const categoryKey = category.title;
    const isOpen = Boolean(chatOpenByCategory[categoryKey]);

    ensureCategoryChatBootstrap(category);

    setChatOpenByCategory((prev) => ({
      ...prev,
      [categoryKey]: !isOpen,
    }));

    if (isOpen) {
      setFocusedStepByCategory((prev) => ({
        ...prev,
        [categoryKey]: null,
      }));
    }
  }

  function focusStepAndOpenChat(
    category: TrainingCategory,
    pattern: string,
    step: string,
  ) {
    const categoryKey = category.title;

    ensureCategoryChatBootstrap(category);

    setChatOpenByCategory((prev) => ({
      ...prev,
      [categoryKey]: true,
    }));

    setFocusedStepByCategory((prev) => ({
      ...prev,
      [categoryKey]: {
        pattern,
        step,
      },
    }));

    setChatDraftByCategory((prev) => ({
      ...prev,
      [categoryKey]: `Can you explain how to apply this step in real life?\n\n${step}`,
    }));

    setChatErrorByCategory((prev) => ({
      ...prev,
      [categoryKey]: "",
    }));
  }

  function clearFocusedStep(categoryTitle: string) {
    setFocusedStepByCategory((prev) => ({
      ...prev,
      [categoryTitle]: null,
    }));
  }

  async function handleAskGemini(
    event: FormEvent<HTMLFormElement>,
    category: TrainingCategory,
  ) {
    event.preventDefault();

    const categoryKey = category.title;
    const question = (chatDraftByCategory[categoryKey] || "").trim();

    if (!question) {
      setChatErrorByCategory((prev) => ({
        ...prev,
        [categoryKey]: "Type your question first.",
      }));
      return;
    }

    setChatErrorByCategory((prev) => ({
      ...prev,
      [categoryKey]: "",
    }));
    setChatLoadingByCategory((prev) => ({
      ...prev,
      [categoryKey]: true,
    }));

    const existingMessages = chatMessagesByCategory[categoryKey] || [
      buildCategoryWelcomeMessage(categoryKey),
    ];
    const selectedStep = focusedStepByCategory[categoryKey] || null;
    const history = existingMessages.slice(-MAX_CHAT_HISTORY_MESSAGES);

    setChatMessagesByCategory((prev) => ({
      ...prev,
      [categoryKey]: [...existingMessages, { role: "user", content: question }],
    }));

    setChatDraftByCategory((prev) => ({
      ...prev,
      [categoryKey]: "",
    }));

    try {
      const response = await fetch("/api/ai-step-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryTitle: category.title,
          categorySubtitle: category.subtitle,
          misbehaviors: category.misbehaviors,
          selectedStep,
          question,
          history,
        }),
      });

      const payload = (await response.json()) as AskGeminiResponse;

      if (!response.ok) {
        setChatErrorByCategory((prev) => ({
          ...prev,
          [categoryKey]: payload.error || "Gemini could not answer right now.",
        }));
        return;
      }

      const replyText = (payload.reply || "").trim();
      if (!replyText) {
        setChatErrorByCategory((prev) => ({
          ...prev,
          [categoryKey]: "Gemini returned an empty reply.",
        }));
        return;
      }

      setChatMessagesByCategory((prev) => {
        const current = prev[categoryKey] || [];

        return {
          ...prev,
          [categoryKey]: [
            ...current,
            { role: "assistant", content: stripMarkdownSyntax(replyText) },
          ],
        };
      });
    } catch {
      setChatErrorByCategory((prev) => ({
        ...prev,
        [categoryKey]: "Network error while contacting Gemini.",
      }));
    } finally {
      setChatLoadingByCategory((prev) => ({
        ...prev,
        [categoryKey]: false,
      }));
    }
  }

  return (
    <main className="min-h-screen bg-[#FFFBF1] px-4 py-10 text-[#3B2A2A] sm:px-6 sm:py-14">
      <section className="relative mx-auto mb-6 max-w-6xl overflow-hidden rounded-[2rem] bg-[#FFF2D0] px-6 py-10 sm:px-10 sm:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#FFB2B2_0%,#FFF2D0_40%,#FFFBF1_100%)]" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E36A6A]/25 bg-[#FFFBF1] px-4 py-2 text-sm font-semibold text-[#E36A6A]">
            <Dumbbell className="size-4" />
            Dog Training Plans
          </div>
          <h1 className="mt-5 font-heading text-3xl leading-tight tracking-tight text-[#5A3333] sm:text-5xl">
            Click a dog category to open training guidance.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#6F4545] sm:text-lg">
            Open each misbehavior accordion to see a clear description and
            step-by-step way to resolve it.
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

      <section className="mx-auto max-w-6xl rounded-[2rem] bg-[#FFFBF1] p-3 shadow-[inset_0_1px_0_rgba(227,106,106,0.08)] sm:p-5">
        <div className="space-y-4 sm:space-y-5">
          {categories.map((category, categoryIndex) => {
            return (
              <details
                key={category.title}
                open={categoryIndex === 0}
                className="group rounded-[1.55rem] bg-[#FFF2D0] transition-colors duration-200 open:bg-[#FFB2B2]/35"
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-5 sm:px-6 sm:py-6">
                  <span className="inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFFBF1] shadow-[0_8px_18px_rgba(227,106,106,0.18)]">
                    <Image
                      src={category.imageSrc}
                      alt={category.imageAlt}
                      width={52}
                      height={52}
                      className="size-12"
                    />
                  </span>

                  <div>
                    <h2 className="text-xl font-semibold text-[#514444]">
                      {category.title}
                    </h2>
                    <p className="mt-1 text-sm text-[#6F4545]">
                      {category.subtitle}
                    </p>
                  </div>

                  <span className="ml-auto inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FFFBF1] text-[#E36A6A]">
                    <ChevronDown className="size-5 transition-transform group-open:rotate-180" />
                  </span>
                </summary>

                <div
                  className={`grid gap-4 px-4 pb-5 sm:px-6 sm:pb-6 ${
                    chatOpenByCategory[category.title]
                      ? "lg:grid-cols-[1.2fr_0.8fr]"
                      : ""
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#5A3333]">
                        Common misbehaving patterns
                      </p>

                      <button
                        type="button"
                        onClick={() => toggleCategoryChat(category)}
                        className="inline-flex items-center gap-1 rounded-full border border-[#E36A6A]/35 bg-[#FFFBF1] px-3 py-1.5 text-xs font-semibold text-[#5A3333] transition-colors hover:border-[#E36A6A] hover:bg-[#FFB2B2]/35"
                      >
                        <MessageCircle className="size-3.5 text-[#E36A6A]" />
                        {chatOpenByCategory[category.title]
                          ? "Hide Gemini"
                          : "Ask Gemini"}
                      </button>
                    </div>

                    {category.misbehaviors.map((item, misbehaviorIndex) => (
                      <details
                        key={`${category.title}-${misbehaviorIndex}`}
                        className="group/mis rounded-xl bg-[#FFFBF1]"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-[#5A3333]">
                          <span>{item.pattern}</span>
                          <ChevronDown className="size-4 shrink-0 text-[#E36A6A] transition-transform group-open/mis:rotate-180" />
                        </summary>

                        <div className="px-4 pb-4">
                          <div className="h-px bg-[#E36A6A]/20" />

                          <h3 className="pt-3 text-sm font-semibold text-[#5A3333]">
                            How to resolve
                          </h3>
                          <p className="mt-1 text-sm leading-relaxed text-[#5F4A4A]">
                            {item.description}
                          </p>

                          <ol className="mt-3 space-y-2 text-sm text-[#5F4A4A]">
                            {item.steps.map((step, stepIndex) => (
                              <li
                                key={`${item.pattern}-${stepIndex}`}
                                className="flex items-start gap-2"
                              >
                                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#FFB2B2] text-xs font-semibold text-[#5A3333]">
                                  {stepIndex + 1}
                                </span>
                                <span className="flex-1">{step}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    focusStepAndOpenChat(
                                      category,
                                      item.pattern,
                                      step,
                                    )
                                  }
                                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[#E36A6A]/30 bg-[#FFFBF1] text-[#E36A6A] transition-colors hover:border-[#E36A6A] hover:bg-[#FFB2B2]/35"
                                  aria-label={`Ask Gemini about step ${stepIndex + 1}`}
                                  title="Ask Gemini about this step"
                                >
                                  <MessageCircle className="size-3.5" />
                                </button>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </details>
                    ))}
                  </div>

                  {chatOpenByCategory[category.title] ? (
                    <aside className="h-fit rounded-xl border border-[#E36A6A]/20 bg-[#FFFBF1] p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#5A3333]">
                          <Sparkles className="size-4 text-[#E36A6A]" />
                          Gemini step assistant
                        </p>

                        <button
                          type="button"
                          onClick={() => toggleCategoryChat(category)}
                          className="text-xs font-semibold text-[#7C5A5A] underline underline-offset-2"
                        >
                          Close
                        </button>
                      </div>

                      {focusedStepByCategory[category.title] ? (
                        <div className="mt-2 rounded-lg bg-[#FFF2D0] p-2 text-xs text-[#5F4A4A]">
                          <p className="font-semibold text-[#5A3333]">
                            Focused step
                          </p>
                          <p className="mt-1">
                            {focusedStepByCategory[category.title]?.step}
                          </p>
                          <button
                            type="button"
                            onClick={() => clearFocusedStep(category.title)}
                            className="mt-1 text-[11px] font-semibold text-[#7C5A5A] underline underline-offset-2"
                          >
                            Ask generally instead
                          </button>
                        </div>
                      ) : null}

                      <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                        {(
                          chatMessagesByCategory[category.title] || [
                            buildCategoryWelcomeMessage(category.title),
                          ]
                        ).map((message, messageIndex) => (
                          <div
                            key={`${category.title}-chat-${messageIndex}`}
                            className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                              message.role === "assistant"
                                ? "bg-[#FFF2D0] text-[#4B3A3A]"
                                : "bg-[#FFB2B2]/45 text-[#5A3333]"
                            }`}
                          >
                            {message.content}
                          </div>
                        ))}

                        {chatLoadingByCategory[category.title] ? (
                          <div className="inline-flex items-center gap-2 rounded-lg bg-[#FFF2D0] px-3 py-2 text-xs font-medium text-[#6A4E4E]">
                            <LoaderCircle className="size-3.5 animate-spin text-[#E36A6A]" />
                            Gemini is thinking...
                          </div>
                        ) : null}
                      </div>

                      {chatErrorByCategory[category.title] ? (
                        <p className="mt-2 rounded-lg bg-[#FFB2B2]/55 px-2.5 py-2 text-xs font-medium text-[#5A3333]">
                          {chatErrorByCategory[category.title]}
                        </p>
                      ) : null}

                      <form
                        onSubmit={(event) => handleAskGemini(event, category)}
                        className="mt-3 space-y-2"
                      >
                        <textarea
                          value={chatDraftByCategory[category.title] || ""}
                          onChange={(event) => {
                            const nextValue = event.target.value;

                            setChatDraftByCategory((prev) => ({
                              ...prev,
                              [category.title]: nextValue,
                            }));
                          }}
                          placeholder="Ask about a specific step, timing, rewards, or troubleshooting..."
                          className="min-h-24 w-full rounded-xl border border-[#E36A6A]/25 bg-[#FFFDF7] px-3 py-2 text-sm text-[#5A3333] outline-none placeholder:text-[#8B6C6C] focus:border-[#E36A6A]"
                        />

                        <button
                          type="submit"
                          disabled={Boolean(
                            chatLoadingByCategory[category.title],
                          )}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E36A6A] px-4 py-2 text-xs font-semibold text-[#FFFBF1] transition-colors hover:bg-[#cc5959] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {chatLoadingByCategory[category.title] ? (
                            <>
                              <LoaderCircle className="size-3.5 animate-spin" />
                              Asking Gemini...
                            </>
                          ) : (
                            <>
                              <SendHorizonal className="size-3.5" />
                              Ask Gemini
                            </>
                          )}
                        </button>
                      </form>
                    </aside>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </main>
  );
}
