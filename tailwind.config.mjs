/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
	// darkMode: "media",
	darkMode: ["class", '[data-skin-mode="dark"]'],
	theme: {
		extend: {
			animation: {
				"appear-bottom": "appear-bottom 1ms linear both",
			},
			keyframes: {
				"appear-bottom": {
					from: { opacity: 0, bottom: "-200px" },
					to: { opacity: 1, bottom: 0 },
				},
			},
		},
	},
	plugins: [],
};
