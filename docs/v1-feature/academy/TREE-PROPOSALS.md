# Academy tree: proposed changes from the plan pass (2026-10-06)

The three plan writers checked their plans against `src/learn/v1/academyTree.mjs` exactly, so the tree is unchanged until these are accepted. Applying any of them means re-running the three `plans/check-*.mjs` scripts.

## Wording
- `r-showdown`: the stated misconception is mostly the real rule (the last river bettor does show first). Replace with "You must show your cards to win."
- `x-check-raise`: replace "Check-raising is bad manners" with "A check-raise always means a monster."
- `f-value-betting`: "Check strong hands to trap" conflicts with `h-exploits` ("trap the LAG"); narrow it to "Always check strong hands to trap."
- `o-heads-up`, `o-six-max`, `o-live`: write misconceptions (currently empty).
- `r-actions` objective: name the no-limit minimum raise and the big blind's option. `r-seats-blinds`: state the heads-up rule (button posts the small blind, acts first preflop, last postflop).

## Prerequisites
- `m-spr` ← `m-implied-odds` (instead of `m-ev`).
- `y-tilt` ← add `m-variance`.
- `x-mdf` ← add `p-blind-defense`.
- `p-starting-hands` ← relax `m-pot-odds` to `m-chance-as-share`.
- `p-three-bet` ← add `m-pot-odds`.
- `h-range-narrowing` ← consider `f-cbet` instead of `x-mdf`.
- `o-multiway` ← add `x-fold-equity`.
- `f-playing-draws`: its raise branch previews `x-fold-equity`, which comes later; keep it as a preview or move the node.

## Mapping and formats
- The shipped positions lesson teaches opening ranges: map it to `p-position-value` / `p-open-raise`, and give `r-seats-blinds` a new short film.
- Add `film` to `m-implied-odds`, `p-blind-defense`, `p-three-bet`.
- `h-player-types`: name `balanced` as the baseline (no roster bot has that archetype).
- Dirty outs are still taught nowhere; `m-outs` or a new node should carry them.
- Range tiles need a palette colour; proposed violet #5d5afd.

## Seat names
Existing lessons call the seat MP, not HJ. Plans keep MP and say "also called the hijack" once.
