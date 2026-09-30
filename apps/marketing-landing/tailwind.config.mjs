/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				// Ruta C · Portal (Arcom POS)
				//
				// `terra` is the brand accent and is NOT text-safe on its own:
				//   #C75B39 on #F6F1EA = 3.75:1, on #1F1A17 = 4.09:1
				// Both clear AA only for large text. The ramp therefore splits
				// the accent by surface, so text always has a compliant step:
				//   terra-200/300  -> text & icons on ink   (6.6:1 / 6.7:1)
				//   terra-500       -> fills, borders, large text
				//   terra-700/800   -> text on sand/paper    (4.9:1 / 6.3:1)
				terra: {
					DEFAULT: '#c75b39',
					100: '#f7e6dd',
					200: '#efc0ab',
					300: '#e08a6e',
					400: '#d4734f',
					500: '#c75b39',
					600: '#b75434',
					700: '#a94d30',
					800: '#8f4229',
					900: '#6b311f',
				},
				ink: '#1f1a17',
				stone: '#6e635c',
				// Secondary text on dark surfaces. `stone` is the secondary text
				// on light (5.2:1 on sand) but only reaches 2.96:1 on ink, so dark
				// surfaces need the mirror step: #C4B9AA = 8.9:1 on ink.
				mist: '#c4b9aa',
				sand: '#f6f1ea',
				paper: '#fdfcfa',
				line: '#e8e2d9',
				// Same surface split as `terra`: the board's #E2504B is only
				// 3.74:1 on paper, so text uses the 600/800 steps.
				alert: {
					DEFAULT: '#e2504b',
					100: '#fbe6e5',
					200: '#f5c9c7',
					300: '#efaaa8',
					400: '#e8807d',
					500: '#e2504b',
					600: '#b9423d',
					700: '#a73b38',
					800: '#953532',
					900: '#712826',
				},
				primary: {
					DEFAULT: '#1f1a17',
					50: '#fdfcfa',
					100: '#f6f1ea',
					200: '#e8e2d9',
					300: '#d7ccc2',
					400: '#bfb0a3',
					500: '#a29486',
					600: '#85796d',
					700: '#6e635c',
					800: '#4d4742',
					900: '#1f1a17',
					950: '#0f0d0b',
				},
				'on-primary': '#ffffff',
				'emerald-cta': '#1f1a17',
				'amber-accent': '#c75b39',
				'surface': '#fdfcfa',
				'surface-container': '#f6f1ea',
				'surface-container-low': '#fdfcfa',
				'surface-container-high': '#e8e2d9',
				'surface-variant': '#e8e2d9',
				'on-surface': '#1f1a17',
				'on-surface-variant': '#6e635c',
			},
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
			},
			spacing: {
				'margin-desktop': '48px',
				'margin-mobile': '16px',
				'container-max': '1280px',
				'section-gap': '100px',
			},
		},
	},
	plugins: [],
}
