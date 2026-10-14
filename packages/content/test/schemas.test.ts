import { describe, expect, it } from "bun:test";
import {
  certificationSchema,
  contentSchema,
  educationSchema,
  experienceSchema,
  linkSchema,
  nowItemSchema,
  profileSchema,
} from "../src/schemas";

const validProfile = {
  name: "Jane Doe",
  headline: "Headline",
  location: "City",
  summary: "Summary",
  links: [{ label: "GitHub", url: "https://example.com/github" }],
};

const validExperience = {
  id: "acme",
  company: "Acme",
  role: "Engineer",
  startDate: "2020-01",
  endDate: null,
  summary: "Did things",
  highlights: ["One"],
  tech: ["TypeScript"],
};

const validEducation = {
  id: "school",
  institution: "Example School",
  title: "Degree",
  startDate: "2001",
  endDate: null,
};

const validCertification = {
  id: "cert",
  name: "Certification",
  issuer: "Issuer",
};

const validNow = {
  id: "course",
  kind: "course",
  title: "Course",
  description: "Learning",
  progress: 50,
  status: "in-progress",
  updatedAt: "2026-10-01",
  links: [],
  tags: [],
};

describe("profileSchema", () => {
  it("accepts a valid profile", () => {
    expect(profileSchema.safeParse(validProfile).success).toBe(true);
  });

  it("rejects an invalid link url", () => {
    const result = linkSchema.safeParse({ label: "x", url: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = profileSchema.safeParse({ ...validProfile, email: "nope" });
    expect(result.success).toBe(false);
  });
});

describe("experienceSchema", () => {
  it("accepts a valid entry", () => {
    expect(experienceSchema.safeParse(validExperience).success).toBe(true);
  });

  it("rejects a malformed startDate", () => {
    const result = experienceSchema.safeParse({
      ...validExperience,
      startDate: "2020",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range month", () => {
    const result = experienceSchema.safeParse({
      ...validExperience,
      endDate: "2020-13",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a missing summary (older roles only have highlights/tech)", () => {
    const { summary: _summary, ...withoutSummary } = validExperience;
    expect(experienceSchema.safeParse(withoutSummary).success).toBe(true);
  });
});

describe("educationSchema", () => {
  it("accepts a year-only date range", () => {
    expect(educationSchema.safeParse(validEducation).success).toBe(true);
  });

  it("accepts a year-month date range", () => {
    const result = educationSchema.safeParse({
      ...validEducation,
      startDate: "2001-03",
      endDate: "2006-12",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a date that is neither YYYY nor YYYY-MM", () => {
    const result = educationSchema.safeParse({
      ...validEducation,
      startDate: "2001-3",
    });
    expect(result.success).toBe(false);
  });
});

describe("certificationSchema", () => {
  it("accepts a minimal certification (no date or url)", () => {
    expect(certificationSchema.safeParse(validCertification).success).toBe(
      true,
    );
  });

  it("accepts a year date and a url", () => {
    const result = certificationSchema.safeParse({
      ...validCertification,
      date: "2013",
      url: "https://example.com/badge",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid url", () => {
    const result = certificationSchema.safeParse({
      ...validCertification,
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("nowItemSchema", () => {
  it("accepts valid boundaries (progress 0 and 100)", () => {
    expect(nowItemSchema.safeParse({ ...validNow, progress: 0 }).success).toBe(
      true,
    );
    expect(
      nowItemSchema.safeParse({ ...validNow, progress: 100 }).success,
    ).toBe(true);
  });

  it("rejects progress above 100", () => {
    const result = nowItemSchema.safeParse({ ...validNow, progress: 150 });
    expect(result.success).toBe(false);
  });

  it("rejects progress below 0", () => {
    const result = nowItemSchema.safeParse({ ...validNow, progress: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer progress", () => {
    const result = nowItemSchema.safeParse({ ...validNow, progress: 33.5 });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown status", () => {
    const result = nowItemSchema.safeParse({ ...validNow, status: "archived" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown kind", () => {
    const result = nowItemSchema.safeParse({ ...validNow, kind: "podcast" });
    expect(result.success).toBe(false);
  });
});

describe("contentSchema", () => {
  it("rejects content missing a required collection", () => {
    const result = contentSchema.safeParse({ profile: validProfile });
    expect(result.success).toBe(false);
  });

  it("defaults education to an empty array when omitted", () => {
    const result = contentSchema.safeParse({
      profile: validProfile,
      experience: [validExperience],
      skills: [],
      languages: [],
      now: [validNow],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.education).toEqual([]);
  });

  it("defaults certifications to an empty array when omitted", () => {
    const result = contentSchema.safeParse({
      profile: validProfile,
      experience: [validExperience],
      skills: [],
      languages: [],
      now: [validNow],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.certifications).toEqual([]);
  });
});
