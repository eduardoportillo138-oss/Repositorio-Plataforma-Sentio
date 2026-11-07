'use client';

import { Text } from 'tamagui';

export interface TextRange {
  start: number;
  end: number;
}

/**
 * Pinta `text` resaltando los rangos indicados (p. ej. los de `highlightRanges` de core).
 * Devuelve fragmentos para usar dentro de un Paragraph/H4 existente.
 */
export function HighlightedText({ text, ranges }: { text: string; ranges: readonly TextRange[] }) {
  if (ranges.length === 0) return <>{text}</>;
  const parts: { text: string; hit: boolean }[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) parts.push({ text: text.slice(cursor, r.start), hit: false });
    parts.push({ text: text.slice(r.start, r.end), hit: true });
    cursor = r.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), hit: false });

  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <Text key={i} backgroundColor="$yellow5" color="$color12" fontWeight="700">
            {p.text}
          </Text>
        ) : (
          <Text key={i}>{p.text}</Text>
        ),
      )}
    </>
  );
}
