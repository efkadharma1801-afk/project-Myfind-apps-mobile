export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: "pemasukan" | "pengeluaran";
  nominal: number;
  category: string;
  date: string; // Format: YYYY-MM-DD
  note: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  month: string; // Format: YYYY-MM
}

export type ScreenType =
  | "SPLASH"
  | "ONBOARDING1"
  | "ONBOARDING2"
  | "ONBOARDING3"
  | "LOGIN"
  | "REGISTER"
  | "DASHBOARD"
  | "ADD_TRANSACTION"
  | "REPORTS"
  | "BUDGETS"
  | "PROFILE";

export const CATEGORIES_PEMASUKAN = [
  "Gaji",
  "Investasi",
  "Sampingan",
  "Hadiah",
  "Lain-lain"
];

export const CATEGORIES_PENGELUARAN = [
  "Makanan",
  "Transport",
  "Belanja",
  "Tagihan",
  "Hiburan",
  "Kesehatan",
  "Lain-lain"
];

export const CATEGORY_ICONS: Record<string, string> = {
  "Makanan": "restaurant",
  "Transport": "directions_car",
  "Belanja": "shopping_bag",
  "Tagihan": "receipt_long",
  "Hiburan": "sports_esports",
  "Kesehatan": "medical_services",
  "Gaji": "work",
  "Investasi": "trending_up",
  "Sampingan": "monetization_on",
  "Hadiah": "featured_play_list",
  "Lain-lain": "help_outline"
};

export const CATEGORY_COLORS: Record<string, string> = {
  "Makanan": "bg-amber-100 text-amber-700 border-amber-200",
  "Transport": "bg-blue-100 text-blue-700 border-blue-200",
  "Belanja": "bg-purple-100 text-purple-700 border-purple-200",
  "Tagihan": "bg-red-100 text-red-700 border-red-200",
  "Hiburan": "bg-pink-100 text-pink-700 border-pink-200",
  "Kesehatan": "bg-teal-100 text-teal-700 border-teal-200",
  "Gaji": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Investasi": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Sampingan": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Hadiah": "bg-rose-100 text-rose-700 border-rose-200",
  "Lain-lain": "bg-gray-100 text-gray-700 border-gray-200"
};
