"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  Dog,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SitterMapMarker } from "./sitter-map";

const SitterMap = dynamic(() => import("./sitter-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#FFF2D0] text-sm font-semibold text-[#6B4C4C]">
      Loading interactive map...
    </div>
  ),
});

type Sitter = SitterMapMarker & {
  id: string;
  name: string;
  imageSrc: string;
  area: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  distanceKm: number;
  responseTime: string;
  shortInfo: string;
  about: string;
  specialties: string[];
  availability: string;
  featured?: boolean;
};

const sitterSeedData: Omit<Sitter, "id" | "imageSrc" | "featured">[] = [
  {
    name: "Anna Mueller",
    area: "Berlin Mitte",
    rating: 4.9,
    reviews: 128,
    hourlyRate: 18,
    distanceKm: 1.2,
    responseTime: "Usually replies in 10 min",
    shortInfo: "Puppy care and calm socialization walks.",
    about:
      "Certified sitter focused on puppies and small breeds. Great for shy dogs needing a gentle introduction to outdoor routines.",
    specialties: ["Puppy routines", "Positive reinforcement", "Small dogs"],
    availability: "Available today: 10:00 - 18:00",
    coordinates: [52.5208, 13.4095],
  },
  {
    name: "Lukas Schneider",
    area: "Prenzlauer Berg",
    rating: 4.8,
    reviews: 96,
    hourlyRate: 22,
    distanceKm: 2.6,
    responseTime: "Usually replies in 20 min",
    shortInfo: "High-energy dogs, leash manners, long walks.",
    about:
      "Experienced with medium and large breeds, especially adolescents who need structure, exercise, and reliable leash skills.",
    specialties: ["High energy dogs", "Leash training support", "Large breeds"],
    availability: "Next slot: Tomorrow 09:00",
    coordinates: [52.5386, 13.4246],
  },
  {
    name: "Sophie Weber",
    area: "Kreuzberg",
    rating: 5.0,
    reviews: 71,
    hourlyRate: 25,
    distanceKm: 3.4,
    responseTime: "Usually replies in 5 min",
    shortInfo: "Senior dogs and medication-friendly care.",
    about:
      "Specializes in senior and anxious dogs. Comfortable with medication schedules, low-impact play, and comfort-first routines.",
    specialties: ["Senior dogs", "Anxiety-aware care", "Medication support"],
    availability: "Available today: 14:00 - 20:00",
    coordinates: [52.4986, 13.4033],
  },
  {
    name: "Jonas Becker",
    area: "Charlottenburg",
    rating: 4.7,
    reviews: 53,
    hourlyRate: 20,
    distanceKm: 2.1,
    responseTime: "Usually replies in 15 min",
    shortInfo: "Rescue dogs and confidence-building sessions.",
    about:
      "Works closely with rescue dogs that need predictable routines, confidence-building, and stress-aware handling around new triggers.",
    specialties: ["Rescue dogs", "Confidence sessions", "Behavior notes"],
    availability: "Next slot: Today 17:30",
    coordinates: [52.5163, 13.3041],
  },
  {
    name: "Mia Hoffmann",
    area: "Neukoelln",
    rating: 4.9,
    reviews: 84,
    hourlyRate: 21,
    distanceKm: 2.8,
    responseTime: "Usually replies in 12 min",
    shortInfo: "Apartment-safe enrichment and calm evening check-ins.",
    about:
      "Great fit for dogs who need structured in-home care and sniff-based enrichment. Provides clear update notes and feeding logs.",
    specialties: ["Indoor enrichment", "Evening care", "Feeding routines"],
    availability: "Available today: 16:00 - 21:00",
    coordinates: [52.4816, 13.435],
  },
  {
    name: "Felix Wagner",
    area: "Friedrichshain",
    rating: 4.8,
    reviews: 109,
    hourlyRate: 23,
    distanceKm: 3.1,
    responseTime: "Usually replies in 18 min",
    shortInfo: "Active walks and adolescent behavior support.",
    about:
      "Focuses on structured movement sessions for energetic dogs and reinforces calm behavior around urban distractions.",
    specialties: ["Long walks", "Impulse control", "Adolescent dogs"],
    availability: "Next slot: Today 19:00",
    coordinates: [52.5155, 13.454],
  },
  {
    name: "Clara Neumann",
    area: "Moabit",
    rating: 4.9,
    reviews: 66,
    hourlyRate: 20,
    distanceKm: 1.7,
    responseTime: "Usually replies in 9 min",
    shortInfo: "Gentle first-time sitter for shy rescue dogs.",
    about:
      "Works with cautious dogs who need predictable pacing, low-pressure handling, and trust-building before longer sessions.",
    specialties: [
      "Rescue introductions",
      "Stress-aware handling",
      "Routine setup",
    ],
    availability: "Available today: 11:00 - 17:00",
    coordinates: [52.531, 13.341],
  },
  {
    name: "David Klein",
    area: "Wedding",
    rating: 4.7,
    reviews: 58,
    hourlyRate: 19,
    distanceKm: 3.6,
    responseTime: "Usually replies in 24 min",
    shortInfo: "Reliable daily drop-ins and midday potty breaks.",
    about:
      "Supports working-day schedules with dependable timing and short confidence walks for dogs that stay home alone.",
    specialties: ["Drop-ins", "Potty support", "Routine reliability"],
    availability: "Next slot: Tomorrow 12:30",
    coordinates: [52.549, 13.365],
  },
  {
    name: "Emma Fischer",
    area: "Tempelhof",
    rating: 4.8,
    reviews: 92,
    hourlyRate: 22,
    distanceKm: 4.2,
    responseTime: "Usually replies in 16 min",
    shortInfo: "Senior support with gentle movement and meds tracking.",
    about:
      "Experienced with older dogs who need slow-paced walks, medication reminders, and comfort-first check-ins.",
    specialties: ["Senior support", "Medication reminders", "Mobility care"],
    availability: "Available today: 13:00 - 19:00",
    coordinates: [52.4675, 13.3889],
  },
  {
    name: "Noah Braun",
    area: "Schoeneberg",
    rating: 4.9,
    reviews: 140,
    hourlyRate: 24,
    distanceKm: 2.4,
    responseTime: "Usually replies in 7 min",
    shortInfo: "Confident handling for medium and large dogs.",
    about:
      "Uses marker-based reinforcement to keep transitions smooth during walks, guest arrivals, and busy street crossings.",
    specialties: ["Large breeds", "Leash confidence", "Urban walks"],
    availability: "Next slot: Today 18:30",
    coordinates: [52.4829, 13.3562],
  },
  {
    name: "Laura Koenig",
    area: "Lichtenberg",
    rating: 4.8,
    reviews: 77,
    hourlyRate: 20,
    distanceKm: 5.1,
    responseTime: "Usually replies in 14 min",
    shortInfo: "Balanced play sessions and crate routine support.",
    about:
      "Ideal for dogs in routine training, especially families reinforcing crate comfort and consistent mealtime rhythms.",
    specialties: ["Crate routines", "Family dogs", "Play scheduling"],
    availability: "Available today: 15:30 - 20:30",
    coordinates: [52.5158, 13.5004],
  },
  {
    name: "Paul Richter",
    area: "Tiergarten",
    rating: 4.9,
    reviews: 117,
    hourlyRate: 26,
    distanceKm: 1.9,
    responseTime: "Usually replies in 8 min",
    shortInfo: "Premium in-city sitter with behavior report cards.",
    about:
      "Provides concise post-session behavior notes and practical owner follow-ups focused on consistency across home and walks.",
    specialties: ["Behavior notes", "Premium care", "Owner coaching"],
    availability: "Available today: 09:30 - 17:30",
    coordinates: [52.5144, 13.3501],
  },
  {
    name: "Nina Baumann",
    area: "Pankow",
    rating: 4.7,
    reviews: 49,
    hourlyRate: 18,
    distanceKm: 6.3,
    responseTime: "Usually replies in 25 min",
    shortInfo: "Budget-friendly sitter for routine daily visits.",
    about:
      "Great option for predictable daily support with short exercise blocks, food/water checks, and calm companionship.",
    specialties: ["Budget care", "Daily visits", "Routine maintenance"],
    availability: "Next slot: Tomorrow 08:00",
    coordinates: [52.5674, 13.4014],
  },
  {
    name: "Ben Zimmermann",
    area: "Spandau",
    rating: 4.8,
    reviews: 63,
    hourlyRate: 19,
    distanceKm: 7.4,
    responseTime: "Usually replies in 19 min",
    shortInfo: "Yard-safe games and weekend care blocks.",
    about:
      "Offers longer weekend sessions with low-arousal games and structured downtime for dogs who overexcite quickly.",
    specialties: ["Weekend care", "Low-arousal play", "Structured downtime"],
    availability: "Available this weekend: 10:00 - 19:00",
    coordinates: [52.5366, 13.1992],
  },
  {
    name: "Leonie Schmitt",
    area: "Steglitz",
    rating: 4.9,
    reviews: 88,
    hourlyRate: 23,
    distanceKm: 4.8,
    responseTime: "Usually replies in 11 min",
    shortInfo: "Fear-free handling with confidence progression plans.",
    about:
      "Builds confidence plans for sound-sensitive and timid dogs using gradual exposure and reinforcement pacing.",
    specialties: [
      "Fear-free handling",
      "Confidence plans",
      "Sensitivity support",
    ],
    availability: "Available today: 12:00 - 18:00",
    coordinates: [52.4552, 13.3226],
  },
  {
    name: "Tom Hartmann",
    area: "Reinickendorf",
    rating: 4.7,
    reviews: 52,
    hourlyRate: 18,
    distanceKm: 7.1,
    responseTime: "Usually replies in 21 min",
    shortInfo: "Puppy potty schedule and crate transition support.",
    about:
      "Helps new owners establish realistic puppy rhythms with targeted potty timing and calm crate transitions.",
    specialties: [
      "Puppy potty plans",
      "Crate transitions",
      "New owner support",
    ],
    availability: "Next slot: Tomorrow 07:30",
    coordinates: [52.5884, 13.3286],
  },
  {
    name: "Julia Berger",
    area: "Koepenick",
    rating: 4.8,
    reviews: 79,
    hourlyRate: 21,
    distanceKm: 8.2,
    responseTime: "Usually replies in 17 min",
    shortInfo: "Nature-trail walks for calm decompression sessions.",
    about:
      "Perfect for dogs needing decompression time and focused sniff walks away from dense traffic and noise.",
    specialties: ["Decompression walks", "Nature routes", "Calm pacing"],
    availability: "Available today: 16:30 - 20:00",
    coordinates: [52.4464, 13.5721],
  },
  {
    name: "Max Walter",
    area: "Weissensee",
    rating: 4.9,
    reviews: 95,
    hourlyRate: 22,
    distanceKm: 5.5,
    responseTime: "Usually replies in 10 min",
    shortInfo: "Reliable group walk leader with controlled pair matching.",
    about:
      "Pairs dogs by temperament and pace, keeping social sessions structured and low-stress.",
    specialties: [
      "Group walks",
      "Temperament matching",
      "Structured social time",
    ],
    availability: "Available today: 10:30 - 17:00",
    coordinates: [52.553, 13.4621],
  },
  {
    name: "Hannah Krause",
    area: "Hellersdorf",
    rating: 4.8,
    reviews: 68,
    hourlyRate: 19,
    distanceKm: 8.7,
    responseTime: "Usually replies in 22 min",
    shortInfo: "Consistent care for multi-dog households.",
    about:
      "Experienced in multi-dog homes with feeding separation protocols and cooperative leash transitions.",
    specialties: ["Multi-dog homes", "Feeding protocols", "Leash transitions"],
    availability: "Next slot: Today 20:00",
    coordinates: [52.5402, 13.6109],
  },
  {
    name: "Erik Vogt",
    area: "Wilmersdorf",
    rating: 4.7,
    reviews: 57,
    hourlyRate: 20,
    distanceKm: 3.9,
    responseTime: "Usually replies in 20 min",
    shortInfo: "Calm midday breaks and low-noise street routes.",
    about:
      "Good match for noise-sensitive dogs who need predictable midday breaks and quieter neighborhood loops.",
    specialties: ["Noise-sensitive dogs", "Midday walks", "Quiet routes"],
    availability: "Available today: 12:30 - 16:30",
    coordinates: [52.4893, 13.3154],
  },
  {
    name: "Franziska Maier",
    area: "Treptow",
    rating: 4.9,
    reviews: 104,
    hourlyRate: 24,
    distanceKm: 4.9,
    responseTime: "Usually replies in 9 min",
    shortInfo: "Behavior-aware sitter with structured handoff notes.",
    about:
      "Delivers concise behavior observations and next-step recommendations for owners working on consistent home rules.",
    specialties: [
      "Behavior observations",
      "Handoff notes",
      "Consistency coaching",
    ],
    availability: "Available today: 09:00 - 15:00",
    coordinates: [52.4944, 13.4692],
  },
  {
    name: "Jan Keller",
    area: "Marzahn",
    rating: 4.8,
    reviews: 73,
    hourlyRate: 20,
    distanceKm: 8.1,
    responseTime: "Usually replies in 13 min",
    shortInfo: "Playful but structured sessions for active dogs.",
    about:
      "Balances play and recovery with clear cooldown routines, ideal for dogs that stay over-aroused after exercise.",
    specialties: ["Active dogs", "Cooldown routines", "Session structure"],
    availability: "Next slot: Tomorrow 11:00",
    coordinates: [52.5454, 13.5618],
  },
  {
    name: "Paula Franke",
    area: "Britz",
    rating: 4.7,
    reviews: 45,
    hourlyRate: 18,
    distanceKm: 5.7,
    responseTime: "Usually replies in 26 min",
    shortInfo: "Gentle first sitter for newly adopted dogs.",
    about:
      "Supports transition weeks after adoption with predictable check-ins, safe handling, and low-pressure routine building.",
    specialties: ["Newly adopted dogs", "Transition weeks", "Gentle handling"],
    availability: "Available today: 17:00 - 21:00",
    coordinates: [52.4533, 13.4335],
  },
  {
    name: "Simon Krueger",
    area: "Adlershof",
    rating: 4.9,
    reviews: 112,
    hourlyRate: 25,
    distanceKm: 7.9,
    responseTime: "Usually replies in 6 min",
    shortInfo: "Top-rated sitter for smart breed enrichment.",
    about:
      "Designs targeted brain-work sessions for highly engaged breeds to reduce boredom-driven behaviors at home.",
    specialties: ["Mental enrichment", "Smart breeds", "Boredom prevention"],
    availability: "Available today: 08:00 - 14:00",
    coordinates: [52.4356, 13.5451],
  },
];

const womenFirstNames = new Set([
  "Anna",
  "Sophie",
  "Mia",
  "Clara",
  "Emma",
  "Laura",
  "Nina",
  "Leonie",
  "Julia",
  "Hannah",
  "Franziska",
  "Paula",
]);

function getSitterImageByName(name: string): string {
  const firstName = name.split(" ")[0] ?? "";
  return womenFirstNames.has(firstName)
    ? "/sitters/sitter-woman.svg"
    : "/sitters/sitter-man.svg";
}

const sitters: Sitter[] = sitterSeedData.map((sitter, index) => ({
  ...sitter,
  id: `sitter-${index + 1}`,
  imageSrc: getSitterImageByName(sitter.name),
  featured: sitter.rating >= 4.9,
}));

export default function SitterPage() {
  const [activeSitterId, setActiveSitterId] = useState(sitters[0].id);
  const [selectedArea, setSelectedArea] = useState("All locations");
  const [minRating, setMinRating] = useState(0);

  const areaOptions = useMemo(
    () => ["All locations", ...new Set(sitters.map((sitter) => sitter.area))],
    [],
  );

  const filteredSitters = useMemo(
    () =>
      sitters.filter((sitter) => {
        const areaMatch =
          selectedArea === "All locations" || sitter.area === selectedArea;
        const ratingMatch = sitter.rating >= minRating;

        return areaMatch && ratingMatch;
      }),
    [minRating, selectedArea],
  );

  const activeSitter = useMemo(
    () =>
      filteredSitters.find((sitter) => sitter.id === activeSitterId) ??
      filteredSitters[0] ??
      null,
    [activeSitterId, filteredSitters],
  );

  return (
    <main className="min-h-screen bg-[#FFFBF1] px-4 py-10 text-[#3B2A2A] sm:px-6 sm:py-14">
      <section className="relative mx-auto mb-6 max-w-6xl overflow-hidden rounded-[2rem] bg-[#FFF2D0] px-6 py-10 sm:px-10 sm:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#FFB2B2_0%,#FFF2D0_42%,#FFFBF1_100%)]" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E36A6A]/25 bg-[#FFFBF1] px-4 py-2 text-sm font-semibold text-[#E36A6A]">
            <Dog className="size-4" />
            Nearby Sitters Map
          </div>
          <h1 className="mt-5 font-heading text-3xl leading-tight tracking-tight text-[#5A3333] sm:text-5xl">
            Browse available sitters on the map and open full details.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#6F4545] sm:text-lg">
            Click any sitter icon to see quick info and a complete profile with
            specialties, availability, and response speed.
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
        <div className="mb-4 rounded-[1.4rem] border border-[#E36A6A]/20 bg-[#FFF2D0] p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3 sm:gap-4">
            <div className="mr-2 inline-flex items-center gap-2 rounded-full bg-[#FFFBF1] px-3 py-2 text-xs font-semibold text-[#E36A6A]">
              <SlidersHorizontal className="size-3.5" />
              Filters
            </div>

            <label className="grid gap-1 text-xs font-semibold text-[#5A3333]">
              Location
              <select
                value={selectedArea}
                onChange={(event) => setSelectedArea(event.target.value)}
                className="min-w-40 rounded-xl border border-[#E36A6A]/25 bg-[#FFFBF1] px-3 py-2 text-sm font-medium text-[#5A3333] outline-none focus:border-[#E36A6A]"
              >
                {areaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-xs font-semibold text-[#5A3333]">
              Minimum Rating
              <select
                value={String(minRating)}
                onChange={(event) => setMinRating(Number(event.target.value))}
                className="min-w-36 rounded-xl border border-[#E36A6A]/25 bg-[#FFFBF1] px-3 py-2 text-sm font-medium text-[#5A3333] outline-none focus:border-[#E36A6A]"
              >
                <option value="0">Any rating</option>
                <option value="4.7">4.7+</option>
                <option value="4.8">4.8+</option>
                <option value="4.9">4.9+</option>
                <option value="5">5.0 only</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                setSelectedArea("All locations");
                setMinRating(0);
              }}
              className="rounded-full bg-[#FFB2B2] px-4 py-2 text-xs font-semibold text-[#5A3333] transition-colors hover:bg-[#E36A6A] hover:text-[#FFFBF1]"
            >
              Clear filters
            </button>

            <p className="ml-auto text-xs font-semibold text-[#6B4C4C]">
              {filteredSitters.length} sitter
              {filteredSitters.length === 1 ? "" : "s"} found
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-4">
            <div className="relative h-90 overflow-hidden rounded-[1.55rem] border border-[#E36A6A]/20 bg-[#FFF2D0] sm:h-105">
              <SitterMap
                sitters={filteredSitters}
                activeSitterId={activeSitter?.id ?? ""}
                onSelect={(sitterId) => setActiveSitterId(sitterId)}
              />
            </div>

            {filteredSitters.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredSitters.map((sitter) => {
                  const isActive = sitter.id === activeSitter?.id;

                  return (
                    <Card
                      key={sitter.id}
                      className={`relative mx-auto w-full max-w-sm pt-0 transition-all ${
                        isActive
                          ? "ring-2 ring-[#E36A6A]/45 shadow-[0_12px_24px_rgba(227,106,106,0.18)]"
                          : "hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(227,106,106,0.15)]"
                      }`}
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <div className="absolute inset-0 z-10 bg-black/35" />
                        <Image
                          src={sitter.imageSrc}
                          alt={`${sitter.name} profile photo`}
                          width={640}
                          height={360}
                          className="relative z-0 h-full w-full object-cover brightness-65 grayscale-15"
                        />
                      </div>

                      <CardHeader className="space-y-2">
                        <CardAction className="flex flex-wrap items-center justify-between gap-1.5">
                          {sitter.featured ? (
                            <Badge variant="secondary">Featured</Badge>
                          ) : null}
                          <Badge variant="outline">
                            ${sitter.hourlyRate}/hr
                          </Badge>
                        </CardAction>

                        <CardTitle>{sitter.name}</CardTitle>
                        <CardDescription>{sitter.shortInfo}</CardDescription>
                        <p className="text-xs font-semibold text-[#6B4C4C]">
                          {sitter.area}
                        </p>
                      </CardHeader>

                      <CardFooter className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-[#5F4A4A]">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFBF1] px-2 py-1">
                            <Star className="size-3.5 text-[#E36A6A]" />
                            {sitter.rating} ({sitter.reviews})
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFBF1] px-2 py-1">
                            <MapPin className="size-3.5 text-[#E36A6A]" />
                            {sitter.distanceKm} km
                          </span>
                        </div>

                        <Button
                          type="button"
                          onClick={() => setActiveSitterId(sitter.id)}
                          className={`w-full rounded-full border-none ${
                            isActive
                              ? "bg-[#E36A6A] text-[#FFFBF1] hover:bg-[#cc5959]"
                              : "bg-[#FFB2B2] text-[#5A3333] hover:bg-[#E36A6A] hover:text-[#FFFBF1]"
                          }`}
                        >
                          {isActive ? "Selected on map" : "View sitter"}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#E36A6A]/20 bg-[#FFF2D0] px-5 py-6 text-sm text-[#5F4A4A]">
                No sitters match this filter combination. Try lowering the
                minimum rating or selecting a different location.
              </div>
            )}
          </div>

          <aside className="h-fit self-start rounded-[1.55rem] border border-[#E36A6A]/20 bg-[#FFF2D0] p-5 sm:p-6">
            {activeSitter ? (
              <>
                <div className="relative mb-4 overflow-hidden rounded-xl border border-[#E36A6A]/20">
                  <Image
                    src={activeSitter.imageSrc}
                    alt={`${activeSitter.name} profile photo`}
                    width={900}
                    height={500}
                    className="aspect-video w-full object-cover"
                  />
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#514444]">
                      {activeSitter.name}
                    </h2>
                    <p className="mt-1 text-sm text-[#6B4C4C]">
                      {activeSitter.area}
                    </p>
                    {activeSitter.featured ? (
                      <Badge variant="secondary" className="mt-2">
                        Featured sitter
                      </Badge>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-[#FFFBF1] px-3 py-1 text-xs font-semibold text-[#5A3333]">
                    ${activeSitter.hourlyRate}/hr
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {activeSitter.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full bg-[#FFFBF1] px-3 py-1 text-xs font-semibold text-[#5A3333]"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#FFFBF1] p-3">
                    <p className="flex items-center gap-1 text-sm font-semibold text-[#5A3333]">
                      <Star className="size-4 text-[#E36A6A]" />
                      {activeSitter.rating}
                    </p>
                    <p className="mt-1 text-xs text-[#6B4C4C]">
                      {activeSitter.reviews} reviews
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#FFFBF1] p-3">
                    <p className="flex items-center gap-1 text-sm font-semibold text-[#5A3333]">
                      <MapPin className="size-4 text-[#E36A6A]" />
                      {activeSitter.distanceKm} km
                    </p>
                    <p className="mt-1 text-xs text-[#6B4C4C]">
                      From your location
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#FFFBF1] p-3">
                    <p className="flex items-center gap-1 text-sm font-semibold text-[#5A3333]">
                      <Clock3 className="size-4 text-[#E36A6A]" />
                      Fast response
                    </p>
                    <p className="mt-1 text-xs text-[#6B4C4C]">
                      {activeSitter.responseTime}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#FFFBF1] p-3">
                    <p className="flex items-center gap-1 text-sm font-semibold text-[#5A3333]">
                      <ShieldCheck className="size-4 text-[#E36A6A]" />
                      Verified
                    </p>
                    <p className="mt-1 text-xs text-[#6B4C4C]">
                      Background checked
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-[#FFFBF1] p-4">
                  <p className="text-sm font-semibold text-[#5A3333]">
                    Sitter details
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[#5F4A4A]">
                    {activeSitter.about}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-[#6B4C4C]">
                    {activeSitter.availability}
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#E36A6A] px-4 py-2.5 text-sm font-semibold text-[#FFFBF1] transition-colors hover:bg-[#cc5959]"
                >
                  View full sitter profile
                </button>
              </>
            ) : (
              <div className="flex min-h-64 items-center justify-center rounded-2xl bg-[#FFFBF1] px-5 text-center text-sm font-medium leading-relaxed text-[#5F4A4A]">
                No sitter details to show. Adjust filters to view available
                sitters.
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
