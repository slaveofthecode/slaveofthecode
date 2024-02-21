import CV_SP from "@cv/resume-sp.json" assert { type: "json" };
import CV_EN from "@cv/resume.json" assert { type: "json" };

export const getJsonCV = (lang: string) => {
	return lang === "sp" ? CV_SP : CV_EN;
};
