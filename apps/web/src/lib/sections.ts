import type { Content } from "@portfolio/content";

export const cvSectionIds = [
  "experience",
  "skills",
  "languages",
  "education",
  "certifications",
  "now",
  "projects",
] as const;

export type CvSectionId = (typeof cvSectionIds)[number];

export function hasCvSection(content: Content, id: CvSectionId): boolean {
  switch (id) {
    case "experience":
      return content.experience.length > 0;
    case "skills":
      return content.skills.length > 0;
    case "languages":
      return content.languages.length > 0;
    case "education":
      return content.education.length > 0;
    case "certifications":
      return content.certifications.length > 0;
    case "now":
      return content.now.length > 0;
    case "projects":
      return content.personalProjects.length > 0;
  }
}

export function visibleCvSectionIds(content: Content): CvSectionId[] {
  return cvSectionIds.filter((id) => hasCvSection(content, id));
}

export function defaultCvSectionId(content: Content): CvSectionId | "" {
  return hasCvSection(content, "experience")
    ? "experience"
    : (visibleCvSectionIds(content)[0] ?? "");
}
