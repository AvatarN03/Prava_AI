/**
 * Shared Utilities
 * Merged from: utils/utils.js
 * Note: formatDate here handles Firestore Timestamps.
 *       For relative/display dates in blog/feed contexts use formatRelativeDate (blogHelpers.js)
 */

import { clsx } from "clsx";
import { format } from "date-fns";
import { Star } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { CURRENCY_OPTIONS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Tailwind class merging
// ---------------------------------------------------------------------------

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Formats a Firestore Timestamp into a long localised string.
 * e.g. "January 1, 2024"
 */
export function formatFirestoreDate(timestamp) {
  if (!timestamp) return "N/A";
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return "N/A";
}

/**
 * Formats any date/Firestore Timestamp into a short localised string.
 * e.g. "1 Jan 2024"
 */
export function toDate(val) {
  if (!val) return "—";
  const options = { day: "numeric", month: "short", year: "numeric" };
  if (val?.seconds) {
    return new Date(val.seconds * 1000).toLocaleDateString("en-GB", options);
  }
  return new Date(val).toLocaleDateString("en-GB", options);
}

// ---------------------------------------------------------------------------
// Chart/analytics helpers
// ---------------------------------------------------------------------------

export function getMonthKey(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM yyyy");
}

export function getLastMonths(count) {
  const now = new Date();
  const months = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(format(d, "MMM yyyy"));
  }
  return months;
}

/**
 * Compact number formatter for chart ticks and summary cards.
 * Examples: 1000 -> 1K, 1500000 -> 1.5M
 */
export function formatCompactAmount(value) {
  const num = Number(value) || 0;
  const abs = Math.abs(num);

  if (abs >= 1000000) {
    const formatted = (num / 1000000).toFixed(abs >= 10000000 ? 0 : 1);
    return `${formatted.replace(/\.0$/, "")}M`;
  }

  if (abs >= 1000) {
    const formatted = (num / 1000).toFixed(abs >= 10000 ? 0 : 1);
    return `${formatted.replace(/\.0$/, "")}K`;
  }

  return `${num}`;
}

// ---------------------------------------------------------------------------
// Trip helpers
// ---------------------------------------------------------------------------

export function getTripCategoryEmoji(category) {
  const map = {
    "City Break": "🏙️",
    Beach: "🏖️",
    Mountain: "🏔️",
    Adventure: "🧭",
    Cultural: "🏛️",
    Relaxation: "🧘‍♂️",
    Business: "💼",
    Family: "👨‍👩‍👧‍👦",
    Romantic: "❤️",
    "Solo Travel": "🎒",
  };
  return map[category] ?? "🗺️";
}

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

export function getCurrencySymbol(currency) {
  return CURRENCY_OPTIONS.find((c) => c.value === currency)?.symbol ?? "₹";
}

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

export function normalizeSearchText(value = "") {
  return String(value).trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Rating stars (React component)
// ---------------------------------------------------------------------------

export function getRatingStars(rating) {
  const numRating = parseFloat(rating);
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < Math.floor(numRating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300 dark:text-gray-600"
          }
        />
      ))}
      <span className="text-sm ml-1 text-gray-600 dark:text-gray-400 whitespace-nowrap">
        {rating}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form class helpers
// ---------------------------------------------------------------------------

export function inputClass(error, ring = "focus:ring-blue-500") {
  return `w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all focus:ring-2 ${ring} ${
    error ? "border-red-500" : "border-gray-200 dark:border-gray-700"
  }`;
}

export function selectClass(error, ring = "focus:ring-blue-500") {
  return `w-full px-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer transition-all focus:ring-2 ${ring} ${
    error ? "border-red-500" : "border-gray-200 dark:border-gray-700"
  }`;
}