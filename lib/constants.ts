/**
 * Global constants used across the app
 * Keep this file STATIC — no logic, no side effects
 */

// ─────────────────────────────────────────────
// App identity
// ─────────────────────────────────────────────
export const APP_NAME = "Cam Spec Elite";
export const APP_TAGLINE = "Performance calculators, forum, and build data";


// ─────────────────────────────────────────────
// Routes (single source of truth)
// ─────────────────────────────────────────────
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  LOGOUT: "/logout",
  PROFILE: "/profile",

  FORUM: "/forum",
  FORUM_NEW: "/forum/new",

  CALCULATORS: "/calculators",
};


// ─────────────────────────────────────────────
// Calculator slots (15 total)
// ─────────────────────────────────────────────
export const CALCULATOR_SLOTS = [
  { id: "calc-01", name: "Calculator 01" },
  { id: "calc-02", name: "Calculator 02" },
  { id: "calc-03", name: "Calculator 03" },
  { id: "calc-04", name: "Calculator 04" },
  { id: "calc-05", name: "Calculator 05" },
  { id: "calc-06", name: "Calculator 06" },
  { id: "calc-07", name: "Calculator 07" },
  { id: "calc-08", name: "Calculator 08" },
  { id: "calc-09", name: "Calculator 09" },
  { id: "calc-10", name: "Calculator 10" },
  { id: "calc-11", name: "Calculator 11" },
  { id: "calc-12", name: "Calculator 12" },
  { id: "calc-13", name: "Calculator 13" },
  { id: "calc-14", name: "Calculator 14" },
  { id: "calc-15", name: "Calculator 15" },
];


// ─────────────────────────────────────────────
// Supabase / storage
// (no keys here — names only)
// ─────────────────────────────────────────────
export const STORAGE_BUCKETS = {
  PROFILE_AVATARS: "profile-avatars",
  FORUM_IMAGES: "forum-images",
};


// ─────────────────────────────────────────────
// UI constants
// ─────────────────────────────────────────────
export const UI = {
  MAX_CONTENT_WIDTH: 1200,
  AVATAR_SIZE: 128,
  THREAD_IMAGE_MAX_MB: 5,
};
