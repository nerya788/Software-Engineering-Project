/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // צבע המותג הראשי - סגול יוקרתי (לכפתורים ראשיים, כותרות מודגשות)
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // הראשי
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // צבע משני - ורוד פודרה (לאלמנטים דקורטיביים, רקעים עדינים)
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899', // הראשי
          600: '#db2777',
        },
        // צבעי רקע ומשטחים (לבן עם נגיעות אפור/כחול קריר)
        surface: {
          50: '#f8fafc', // רקע כללי
          100: '#f1f5f9',
          200: '#e2e8f0', // גבולות עדינים
          300: '#cbd5e1',
          800: '#1e293b', // טקסט ראשי
          900: '#0f172a',
        },
        // צבעי פעולה
        success: '#10b981', // ירוק אמרלד
        warning: '#f59e0b', // כתום ענבר
        danger: '#ef4444',  // אדום
      },
      fontFamily: {
        sans: ['Heebo', 'Assistant', 'sans-serif'], // פונטים מושלמים לעברית
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)', // צללית רכה ויוקרתית
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)', // צללית לזכוכית
      },
      // הגדרת יחס הזהב לגדלים
      spacing: {
        'golden-sm': '1.618rem',
        'golden-md': '2.618rem',
        'golden-lg': '4.236rem',
      }
    },
  },
  plugins: [],
}