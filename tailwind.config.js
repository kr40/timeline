/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './App.tsx', './main.tsx'],
	theme: {
		extend: {
			fontFamily: {
				display: ["'Grandstander Variable'", "'Nunito Variable'", 'system-ui', 'sans-serif'],
				body:    ["'Nunito Variable'", 'system-ui', 'sans-serif'],
			},
			colors: {
				ink:    '#2B2340',
				muted:  '#756B86',
				paper:  '#FFFBF2',
				dot:    '#EADFCC',
				peach:  '#FFD6C7',
				mint:   '#CBF1EC',
				lav:    '#E6DBFF',
				butter: '#FFE680',
				pink:   '#FFD6E5',
				sky:    '#D3E8FF',
				danger: '#C23B55',
			},
			boxShadow: {
				'sticker-xs': '1px 1px 0 #2B2340',
				'sticker-sm': '2px 2px 0 #2B2340',
				sticker:      '4px 4px 0 #2B2340',
				'sticker-lg': '6px 6px 0 #2B2340',
			},
			borderRadius: {
				card: '22px',
			},
			fontSize: {
				'display-xl': ['clamp(1.6rem, 1.2rem + 1.7vw, 2.25rem)', { lineHeight: '1.08' }],
				'display-lg': ['clamp(1.3rem, 1.08rem + 0.95vw, 1.7rem)', { lineHeight: '1.12' }],
				'display-md': ['clamp(1.05rem, 0.97rem + 0.35vw, 1.25rem)', { lineHeight: '1.22' }],
			},
		},
	},
	plugins: [],
};
