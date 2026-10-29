import assert from "node:assert/strict";
import test from "node:test";
import { EXAMPLE_GRANTED, EXAMPLE_JP, EXAMPLE_SHARED, isIndexable, parseShared, resultPath, safeCheck, sharedQuery } from "./share";

test("share link round-trips", () => {
  for (const ex of [EXAMPLE_SHARED, EXAMPLE_GRANTED, EXAMPLE_JP]) {
    const back = parseShared(new URLSearchParams(sharedQuery(ex)));
    assert.deepEqual(back, ex);
    assert.ok(isIndexable(ex));
    assert.ok(safeCheck(ex));
  }
  assert.equal(resultPath(EXAMPLE_SHARED), "/r?h=mid_long&b=1992-04-10&i=2024-03-01&e=2026-12-15&p=pending&t=2026-10-29");
});

test("bad share params → null", () => {
  assert.equal(parseShared(new URLSearchParams("h=alien&b=1990-01-01&i=2023-01-01")), null);
  assert.equal(parseShared(new URLSearchParams("h=japanese&b=nope&i=2023-01-01")), null);
});
