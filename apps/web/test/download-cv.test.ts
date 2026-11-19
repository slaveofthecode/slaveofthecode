import { describe, expect, mock, test } from "bun:test";
import { createCvPdfBlobLoader, isCvPdfMode } from "../src/lib/download-cv";

describe("isCvPdfMode", () => {
  test("accepts only the two PDF variants", () => {
    expect(isCvPdfMode("designed")).toBe(true);
    expect(isCvPdfMode("ats")).toBe(true);
    expect(isCvPdfMode("other")).toBe(false);
    expect(isCvPdfMode(undefined)).toBe(false);
  });
});

describe("createCvPdfBlobLoader", () => {
  test("reuses the generated blob for the same variant", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    const build = mock(async () => blob);
    const load = createCvPdfBlobLoader(build);

    const [first, second] = await Promise.all([
      load("designed"),
      load("designed"),
    ]);

    expect(first).toBe(blob);
    expect(second).toBe(blob);
    expect(build).toHaveBeenCalledTimes(1);
  });

  test("keeps separate blobs per variant", async () => {
    const build = mock(async () => new Blob(["pdf"]));
    const load = createCvPdfBlobLoader(build);

    await load("designed");
    await load("ats");

    expect(build).toHaveBeenCalledTimes(2);
  });

  test("retries a variant after a failed generation", async () => {
    const blob = new Blob(["pdf"]);
    let calls = 0;
    const build = mock(async () => {
      calls += 1;
      if (calls === 1) throw new Error("boom");
      return blob;
    });
    const load = createCvPdfBlobLoader(build);

    let failure: unknown;
    try {
      await load("ats");
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toBe("boom");
    expect(await load("ats")).toBe(blob);
    expect(build).toHaveBeenCalledTimes(2);
  });
});
