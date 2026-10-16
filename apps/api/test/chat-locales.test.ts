import { describe, expect, test } from "bun:test";
import { LOCALES } from "@portfolio/content";
import { CHAT_LOCALES } from "../src/domain/chat";

describe("chat locales", () => {
  test("mirror @portfolio/content LOCALES (kept local so the function never imports the workspace TS package)", () => {
    expect([...CHAT_LOCALES]).toEqual([...LOCALES]);
  });
});
