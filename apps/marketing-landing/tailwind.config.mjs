/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: '#0b2545',
					50: '#f0f7ff',
					100: '#e0effe',
					200: '#b9dffe',
					300: '#7cc2fd',
					400: '#36a4fa',
					500: '#0c87eb',
					600: '#0b2545',
					700: '#081c35',
					800: '#061426',
					900: '#040d18',
					950: '#02060c',
					'fixed': '#d5e3ff',
					'fixed-dim': '#b1c7f0',
				},
				'on-primary': '#ffffff',
				'emerald-cta': '#10B981',
				'amber-accent': '#F59E0B',
				'surface': '#faf9fc',
				'surface-container': '#efedf0',
				'surface-container-low': '#f5f3f6',
				'surface-container-high': '#e9e7eb',
				'surface-variant': '#e3e2e5',
				'on-surface': '#1b1b1e',
				'on-surface-variant': '#44474e',
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
