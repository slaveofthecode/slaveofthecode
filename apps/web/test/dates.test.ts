import { describe, expect, test } from "bun:test";
import { formatPoint, formatRange } from "../src/lib/dates";

describe("formatPoint", () => {
  test("keeps a four-digit year as-is", () => {
    expect(formatPoint("2013")).toBe("2013");
    expect(formatPoint("2001")).toBe("2001");
  });

  test("renders a year-month with an English month", () => {
    expect(formatPoint("2013-12")).toBe("Dec 2013");
    expect(formatPoint("2011-07")).toBe("Jul 2011");
  });

  test("returns unrecognized input unchanged", () => {
    expect(formatPoint("unknown")).toBe("unknown");
  });
});

describe("formatRange", () => {
  test("uses the present label when the end is null", () => {
    expect(formatRange("2021-02", null, "Present")).toBe("Feb 2021 – Present");
  });

  test("joins both ends", () => {
    expect(formatRange("2007-06", "2008-06", "Present")).toBe(
      "Jun 2007 – Jun 2008",
    );
    expect(formatRange("2001", "2006", "Present")).toBe("2001 – 2006");
  });
});
