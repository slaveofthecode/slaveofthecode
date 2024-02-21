import CV_DE from "@cv/resume-de.json" assert { type: "json" };
import CV_SP from "@cv/resume-sp.json" assert { type: "json" };
import CV_EN from "@cv/resume.json" assert { type: "json" };

export const getJsonCV = (lang: string) => {
	return lang === "sp" ? CV_SP : lang === "de" ? CV_DE : CV_EN;
};
