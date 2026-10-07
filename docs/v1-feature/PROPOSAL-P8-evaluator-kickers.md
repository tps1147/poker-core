# P8: `compareHands` ignores kickers (main-owned fix)

Found by the academy plan check script on 2026-10-06; reproduced by hand against the active `poker-core` checkout (HEAD 6382201a).

```js
const { evaluateHand, compareHands } = require("./src/eval/pokerEvaluator.js");
// board A♥ 7♦ 4♣ 9♠ 2♥ — A♠K♦ vs A♣Q♦
evaluateHand(...) // {"rank":2,"name":"One Pair","value":12} for both
compareHands(a, q) // 0 (tie); correct result: A♠K♦ wins on the king kicker
```

- The result object only carries the paired rank (`value`), so one pair, two pair, trips, quads and high card cannot be ordered by kickers.
- Consumer found: `flop52web/src/components/learn/engine/session/previewGrading.js` (signed-out lesson preview). The server game engine was not checked.
- Reported but not reproduced here: flush detection depends on the suit symbol format passed in.

Proposal: main adds kicker-ordered comparison (the full five-card rank vector) to the shared evaluator, with fixtures for kicker wins, counterfeits, board-plays splits and the wheel. Academy lessons must not use `compareHands` for any kicker spot until that lands; the plan check scripts use their own kicker-aware scorer.
