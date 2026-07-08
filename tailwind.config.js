export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './App.tsx', './main.tsx'],
	theme: {
		extend: {
			fontFamily: {
				poppins: ["'Poppins'", 'sans-serif'],
				nunito:  ["'Nunito'", 'sans-serif'],
			},
			colors: {
				cream:    '#fcf8f7',
				peach:    '#FF8C69',
				mint:     '#6CC9C9',
				lavender: '#B39DDB',
			},
		},
	},
	plugins: [],
};
