export const DEFAULT_QUICK_RESPONSES = [
  'Please watch the screen while I sign.',
  'Can you repeat that slowly?',
  'I need help. Please assist me.',
  'Thank you for understanding.',
];

export const getQuickResponseStorageKey = (userId) => {
  if (!userId) return 'isl-quick-phrases';
  return `isl-quick-phrases-${userId}`;
};

export const normalizeQuickResponses = (responses) => {
  if (!Array.isArray(responses)) return [];

  const unique = [];
  const seen = new Set();

  responses.forEach((item) => {
    if (typeof item !== 'string') return;
    const phrase = item.trim();
    if (!phrase || seen.has(phrase)) return;
    seen.add(phrase);
    unique.push(phrase);
  });

  return unique;
};
