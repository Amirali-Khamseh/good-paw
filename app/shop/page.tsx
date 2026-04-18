import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Heart, ShoppingBag, ShoppingCart } from "lucide-react";

type MerchItem = {
  id: number;
  name: string;
  image: string;
  price: string;
  description: string;
};

const merchItems: MerchItem[] = [
  {
    id: 1,
    name: "Good Paw Bandana",
    image: "/shop-1.png",
    price: "EUR 18",
    description: "Soft everyday bandana with signature paw branding.",
  },
  {
    id: 2,
    name: "Collar and Leash Set",
    image: "/shop-2.png",
    price: "EUR 34",
    description: "Durable matching set with lightweight metal hardware.",
  },
  {
    id: 3,
    name: "Paw Logo Hoodie",
    image: "/shop-3.png",
    price: "EUR 29",
    description: "Warm hoodie made for comfort on chilly walks.",
  },
  {
    id: 4,
    name: "Treat Pouch",
    image: "/shop-4.png",
    price: "EUR 16",
    description: "Clip-on reward pouch for training sessions outside.",
  },
  {
    id: 5,
    name: "Training Frisbee",
    image: "/shop-5.png",
    price: "EUR 14",
    description: "Soft-grip frisbee designed for active play drills.",
  },
];

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-[#FFFBF1] px-4 py-10 text-[#3B2A2A] sm:px-6 sm:py-14">
      <section className="relative mx-auto mb-6 max-w-6xl overflow-hidden rounded-[2rem] bg-[#FFF2D0] px-6 py-10 sm:px-10 sm:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#FFB2B2_0%,#FFF2D0_42%,#FFFBF1_100%)]" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E36A6A]/25 bg-[#FFFBF1] px-4 py-2 text-sm font-semibold text-[#E36A6A]">
            <ShoppingBag className="size-4" />
            Good Paw Merch
          </div>
          <h1 className="mt-5 font-heading text-3xl leading-tight tracking-tight text-[#5A3333] sm:text-5xl">
            Shop branded essentials using your new merch images.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#6F4545] sm:text-lg">
            Products below are rendered from shop-number image files inside the
            public folder.
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {merchItems.map((item) => (
            <article
              key={item.id}
              className="rounded-[1.55rem] bg-[#FFF2D0] p-4 transition-colors duration-200 hover:bg-[#FFB2B2]/35"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#FFFBF1]">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              <div className="mt-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-[#514444]">
                    {item.name}
                  </h2>
                  <span className="rounded-full bg-[#FFFBF1] px-2.5 py-1 text-xs font-semibold text-[#5A3333]">
                    {item.price}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#6F4545]">
                  {item.description}
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#E36A6A] px-3 py-1.5 text-xs font-semibold text-[#FFFBF1] transition-colors hover:bg-[#cc5959]"
                  >
                    <ShoppingCart className="size-3.5" />
                    Add to basket
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E36A6A]/30 bg-[#FFFBF1] px-3 py-1.5 text-xs font-semibold text-[#5A3333] transition-colors hover:bg-[#FFB2B2]/40"
                  >
                    <Heart className="size-3.5 text-[#E36A6A]" />
                    Favorite
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
