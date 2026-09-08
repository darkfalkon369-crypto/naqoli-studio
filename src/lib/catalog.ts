export interface Category {
  key: string;
  emoji: string;
  chip: string;
  thumb: string;
  bar: string;
  titles: string[];
  scene: { from: string; to: string; deco: string[] };
}

export const CATEGORIES: Category[] = [
  {
    key: "حیوانات",
    emoji: "🦁",
    chip: "bg-coral-100 text-coral-700",
    thumb: "/thumbs/animals.jpg",
    bar: "#f4552e",
    titles: [
      "شیر کوچولو و دوستانش در جنگل",
      "جوجه‌تیغی مهربان و قصه دوستی",
      "پنگوئن کوچولو روی یخ‌ها می‌رقصد",
      "خرگوش بازیگوش هویج‌ها را می‌شمارد",
    ],
    scene: { from: "#ffe7cf", to: "#ffb98a", deco: ["🦁", "🐰", "🐘", "🦒", "🌼"] },
  },
  {
    key: "اعداد",
    emoji: "🌟",
    chip: "bg-sun-100 text-sun-600",
    thumb: "/thumbs/numbers.jpg",
    bar: "#f2a81d",
    titles: [
      "شمارش ستاره‌ها از ۱ تا ۱۰ ✨",
      "جمع و تفریق با سیب‌های قرمز 🍎",
      "اعداد فارسی با بادکنک‌های رنگی 🎈",
      "بیست انگشت، بیست عدد شیرین",
    ],
    scene: { from: "#fff3cf", to: "#ffd97a", deco: ["🌟", "1️⃣", "2️⃣", "3️⃣", "🎈"] },
  },
  {
    key: "رنگ‌ها",
    emoji: "🌈",
    chip: "bg-teal-100 text-teal-700",
    thumb: "/thumbs/colors.jpg",
    bar: "#12897e",
    titles: [
      "رنگ‌های رنگین‌کمان را بشناس 🌈",
      "ترانه رنگ‌ها: قرمز، آبی، زرد 🎨",
      "رقص رنگ‌ها با مداد شمعی 🖍️",
      "توپ‌های رنگی را جور کن!",
    ],
    scene: { from: "#ddf3ee", to: "#8fd8c8", deco: ["🌈", "🎨", "🖍️", "🎈", "☁️"] },
  },
  {
    key: "سیارات",
    emoji: "🚀",
    chip: "bg-[#e8e2f6] text-berry-500",
    thumb: "/thumbs/space.jpg",
    bar: "#8a5cc0",
    titles: [
      "سفر به سیاره‌ها با ربات نقلی 🚀",
      "موشک نقلی به ماه می‌رود 🌙",
      "ستاره‌های دنباله‌دار را بشناس ☄️",
      "منظومه شمسی برای کوچولوها",
    ],
    scene: { from: "#e9e4f8", to: "#b9a6ec", deco: ["🚀", "🪐", "🌙", "⭐", "👩‍🚀"] },
  },
  {
    key: "وسایل نقلیه",
    emoji: "🚒",
    chip: "bg-[#ffe2e0] text-ruby-500",
    thumb: "/thumbs/vehicles.jpg",
    bar: "#d2483e",
    titles: [
      "صدای ماشین‌ها را حدس بزن 🚒",
      "ماشین آتش‌نشانی قهرمان شهر",
      "قطار شاد به ایستگاه می‌رسد 🚂",
      "هواپیماهای کاغذی در آسمان ✈️",
    ],
    scene: { from: "#ffe1de", to: "#ffa8a0", deco: ["🚒", "🚂", "🚗", "✈️", "🚁"] },
  },
  {
    key: "الفبا",
    emoji: "🧩",
    chip: "bg-[#dcecf8] text-aqua-500",
    thumb: "/thumbs/alphabet.jpg",
    bar: "#2e86c9",
    titles: [
      "الفبای فارسی با حیوانات بامزه",
      "قطار شاد حروف الفبا 🚂",
      "حرف «آ» مثل آب، حرف «ب» مثل بابا",
      "بلوک‌های حروف را بچین و بخوان",
    ],
    scene: { from: "#dcecf8", to: "#9cc8ec", deco: ["🧩", "📚", "✏️", "🦉", "🔤"] },
  },
];

export function categoryOf(key: string): Category {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
}

export const STAGES = [
  "ایده و فیلم‌نامه",
  "تصویرسازی و انیمیشن",
  "صداگذاری و ترانه",
  "رندر نهایی",
  "کاور و بررسی ایمنی",
];

export const VOICES = ["شاد و کودکانه", "آرام و مهربان", "هیجانی و ماجراجو"];
