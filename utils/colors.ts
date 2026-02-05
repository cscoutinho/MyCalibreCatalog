// A curated palette of distinct, readable colors for dark mode
const TAG_PALETTE = [
  { bg: 'bg-red-900/40', text: 'text-red-300', border: 'border-red-800' },
  { bg: 'bg-orange-900/40', text: 'text-orange-300', border: 'border-orange-800' },
  { bg: 'bg-amber-900/40', text: 'text-amber-300', border: 'border-amber-800' },
  { bg: 'bg-yellow-900/40', text: 'text-yellow-300', border: 'border-yellow-800' },
  { bg: 'bg-lime-900/40', text: 'text-lime-300', border: 'border-lime-800' },
  { bg: 'bg-green-900/40', text: 'text-green-300', border: 'border-green-800' },
  { bg: 'bg-emerald-900/40', text: 'text-emerald-300', border: 'border-emerald-800' },
  { bg: 'bg-teal-900/40', text: 'text-teal-300', border: 'border-teal-800' },
  { bg: 'bg-cyan-900/40', text: 'text-cyan-300', border: 'border-cyan-800' },
  { bg: 'bg-sky-900/40', text: 'text-sky-300', border: 'border-sky-800' },
  { bg: 'bg-blue-900/40', text: 'text-blue-300', border: 'border-blue-800' },
  { bg: 'bg-indigo-900/40', text: 'text-indigo-300', border: 'border-indigo-800' },
  { bg: 'bg-violet-900/40', text: 'text-violet-300', border: 'border-violet-800' },
  { bg: 'bg-purple-900/40', text: 'text-purple-300', border: 'border-purple-800' },
  { bg: 'bg-fuchsia-900/40', text: 'text-fuchsia-300', border: 'border-fuchsia-800' },
  { bg: 'bg-pink-900/40', text: 'text-pink-300', border: 'border-pink-800' },
  { bg: 'bg-rose-900/40', text: 'text-rose-300', border: 'border-rose-800' },
];

/**
 * Returns a consistent color object for a given string.
 * Uses a simple DJB2-like hash to select from the palette.
 */
export const getTagColor = (tagName: string) => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % TAG_PALETTE.length;
  return TAG_PALETTE[index];
};