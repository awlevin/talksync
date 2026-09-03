---
"spoken-text": minor
---

The highlight reads as one band rather than a row of tiles. The whitespace
between two words is now a span of its own, carrying `data-spoken-state` and
the past colour once the word after it has been reached, and no word box is
rounded, padded or overlapped on the way. Only the word being spoken is a box
of its own. `classNames.separator` restyles the gaps.
