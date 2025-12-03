/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Poppins', 'sans-serif'],
            },
            colors: {
                dark: '#101010',
                sidebar: '#0D0D0D',
                primary: '#3B82F6', // Blue
                secondary: '#10B981', // Green
                accent: '#F59E0B', // Orange
                danger: '#EF4444', // Red
                card: '#FFFFFF',
                background: '#F3F4F6',
                black: '#0d1822'
            }
        }
    },
    plugins: [],
}
