export type Tokens = {
  /** Whitespace before the first word. */
  lead: string;
  words: string[];
  /** `separators[i]` is the whitespace that follows `words[i]`. */
  separators: string[];
};

/**
 * Split text into words and the whitespace between them, so the original
 * spacing and line breaks survive rendering.
 */
export const tokenize = (text: string): Tokens => {
  const words: string[] = [];
  const separators: string[] = [];
  let lead = "";

  for (const chunk of text.split(/(\s+)/)) {
    if (chunk === "") continue;
    if (/^\s+$/.test(chunk)) {
      if (words.length === 0) lead += chunk;
      else separators[separators.length - 1] += chunk;
    } else {
      words.push(chunk);
      separators.push("");
    }
  }

  return { lead, words, separators };
};
