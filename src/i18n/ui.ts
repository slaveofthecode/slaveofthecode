import { getJsonCV } from "@/utils";

const resumeEN = getJsonCV("en");
const resumeSP = getJsonCV("sp");
const resumeDE = getJsonCV("de");

export const ui = {
	en: {
		"section.aboutMe": "About me",
		"section.experience": "Experience",
		"section.experience.justLastFiveJobs": "just last five jobs",
		"section.education": "Education",
		"section.skills": "Skills",
		"section.projects": "Projects",
		"section.projects.onlyMostImportant": "...only the most important",
		"section.certifications": "Certifications",
		resume: resumeEN,
	},
	sp: {
		"section.aboutMe": "Sobre mi",
		"section.experience": "Experiencia",
		"section.experience.justLastFiveJobs":
			"solo los últimos cinco trabajos",
		"section.education": "Educación",
		"section.skills": "Habilidades",
		"section.projects": "Proyectos",
		"section.projects.onlyMostImportant": "...solo los más importantes",
		"section.certifications": "Certificaciones",
		resume: resumeSP,
	},
	de: {
		"section.aboutMe": "Über mich",
		"section.experience": "Erfahrung",
		"section.experience.justLastFiveJobs": "nur die letzten fünf Jobs",
		"section.education": "Bildung",
		"section.skills": "Fähigkeiten",
		"section.projects": "Projekte",
		"section.projects.onlyMostImportant": "...nur die wichtigsten",
		"section.certifications": "Zertifizierungen",
		resume: resumeDE,
	},
};
