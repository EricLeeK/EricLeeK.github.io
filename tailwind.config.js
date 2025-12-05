/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Nunito"', '"Rounded Mplus 1c"', 'sans-serif'],
                serif: ['"Times New Roman"', '"Songti SC"', '"SimSun"', '"STSong"', '"Merriweather"', 'serif'],
            },
            colors: {
                // Warm cream background
                bg: {
                    primary: '#FAF3E0', // Warmer beige/rice yellow to reduce glare
                    secondary: '#F5F0E6',
                    dark: '#1c1c1e', // Apple-style dark background
                },
                // Sage Green
                sage: {
                    50: '#F2F7F4',
                    100: '#E1EBE4',
                    200: '#C4D7CB',
                    300: '#A6C2B1',
                    400: '#84A98C', // Main
                    500: '#6B8F73',
                    600: '#527059',
                },
                // Salmon/Terra Cotta
                salmon: {
                    50: '#FEF5F3',
                    100: '#FDE8E4',
                    200: '#FBD2CA',
                    300: '#F8B9AD',
                    400: '#E69F8B', // Main
                    500: '#D67D65',
                },
                // Text
                text: {
                    main: '#4A4A4A',
                    muted: '#818181',
                    light: '#9CA3AF',
                }
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
                '4xl': '2.5rem',
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'card': '0 10px 30px -5px rgba(0, 0, 0, 0.03)',
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
