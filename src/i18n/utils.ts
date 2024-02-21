export const LANGUAGES = [
	{ lang: "en", label: "EN" },
	{ lang: "sp", label: "SP" },
	{ lang: "de", label: "DE" },
];

export const DEFAULT_LANG = "en";

import { ui } from "./ui";

export function useTranslatedPath(lang: keyof typeof ui) {
	return function translatePath(path: string, l: string = lang) {
		return l === DEFAULT_LANG ? path : `/${l}${path}`;
	};
}

export function getLangFromUrl(url: URL) {
	const [, lang] = url.pathname.split("/");
	if (lang in ui) return lang as keyof typeof ui;
	return DEFAULT_LANG;
}

export function useTranslations(lang: keyof typeof ui) {
	return function t(key: keyof (typeof ui)[typeof DEFAULT_LANG]) {
		return ui[lang][key] || ui[DEFAULT_LANG][key];
	};
}
