import { describe, expect, test } from "bun:test";
import { formatPoint, formatRange } from "../src/lib/dates";

describe("formatPoint", () => {
  test("keeps a four-digit year as-is", () => {
    expect(formatPoint("2013", "en")).toBe("2013");
    expect(formatPoint("2001", "es")).toBe("2001");
  });

  test("renders a year-month with a localized month", () => {
    expect(formatPoint("2013-12", "en")).toBe("Dec 2013");
    expect(formatPoint("2013-12", "es")).toBe("dic 2013");
    expect(formatPoint("2011-07", "en")).toBe("Jul 2011");
  });

  test("returns unrecognized input unchanged", () => {
    expect(formatPoint("unknown", "en")).toBe("unknown");
  });
});

describe("formatRange", () => {
  test("uses the present label when the end is null", () => {
    expect(formatRange("2021-02", null, "en", "Present")).toBe(
      "Feb 2021 – Present",
    );
    expect(formatRange("2021-02", null, "es", "Actualidad")).toBe(
      "feb 2021 – Actualidad",
    );
  });

  test("joins both ends", () => {
    expect(formatRange("2007-06", "2008-06", "en", "Present")).toBe(
      "Jun 2007 – Jun 2008",
    );
    expect(formatRange("2001", "2006", "es", "Actualidad")).toBe("2001 – 2006");
  });
});
