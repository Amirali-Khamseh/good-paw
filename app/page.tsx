import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BrainCircuit,
  Dog,
  Dumbbell,
  PawPrint,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";

type RouteCard = {
  href: string;
  title: string;
  image: string;
};

const routes: RouteCard[] = [
  {
    href: "/training",
    title: "Training",
    image: "/training.png",
  },
  {
    href: "/sitter",
    title: "Sitter",
    image: "/sitter.png",
  },
  {
    href: "/ai-personal-training",
    title: "AI Coaching",
    image: "/coaching.png",
  },
  {
    href: "/shop",
    title: "Shop",
    image: "/shop.png",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FFFBF1] px-4 py-10 text-[#3B2A2A] sm:px-6 sm:py-14">
      <section className="relative mx-auto mb-6 max-w-6xl overflow-hidden rounded-[2rem] bg-[#FFF2D0] px-6 py-10 sm:px-10 sm:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#FFB2B2_0%,#FFF2D0_40%,#FFFBF1_100%)]" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E36A6A]/25 bg-[#FFFBF1] px-4 py-2 text-sm font-semibold text-[#E36A6A]">
            <PawPrint className="size-4" />
            Good Paw Hub
          </div>
          <h1 className="mt-5 font-heading text-3xl leading-tight tracking-tight text-[#5A3333] sm:text-5xl">
            Your pet care dashboard in one warm, simple starting point.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#6F4545] sm:text-lg">
            Jump into training, AI coaching, sitter support, and shopping from
            one clear home screen.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl rounded-[2rem] bg-[#FFFBF1] p-3 shadow-[inset_0_1px_0_rgba(227,106,106,0.08)] sm:p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {routes.map((route) => {
            return (
              <Link
                key={route.href}
                href={route.href}
                className="group flex min-h-32 flex-col items-center justify-center rounded-[1.55rem] bg-[#FFF2D0] px-4 py-6 text-center transition-colors duration-200 hover:bg-[#FFB2B2]/55"
              >
                <span className="inline-flex size-14 items-center justify-center rounded-full  ">
                  <Image
                    alt="logos"
                    src={route.image}
                    width={150}
                    height={150}
                  />
                </span>
                <span className="mt-4 text-base font-semibold text-[#514444]">
                  {route.title}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
