import { createContext, useContext, useEffect, useState } from "react";
// נניח שיש לך axios מוגדר, אם לא - תייבא את הספרייה הרגילה
import axios from "axios"; 

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // בדיקה ראשונית: האם יש משהו שמור בזיכרון המקומי? אם לא, לך על 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  // פונקציה להחלפת נושא
  const toggleTheme = async (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    // עדכון ה-HTML Class (זה מה שמפעיל את Tailwind)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // אופציונלי: שליחה לשרת לשמירה ב-DB (דורש שנתיב ה-API יהיה מוכן)
    try {
      // עדכן את ה-URL בהתאם לנתיב האמיתי שלך
      // await axios.put('/api/users/settings', { theme: newTheme });
    } catch (error) {
      console.error("Failed to save theme preference to DB", error);
    }
  };

  // בעת טעינת הדף, וודא שה-Class הנכון נמצא על ה-HTML
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);