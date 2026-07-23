import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { MoonStar } from "./animate-ui/icons/moon-star";
import { Sun } from "./animate-ui/icons/sun";

type ActiveTheme = "light" | "dark" | null;

export default function ThemeIcons() {
  const [activeTheme, setActiveTheme] = useState<ActiveTheme>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const syncActiveTheme = (darkMode: boolean) => {
      setActiveTheme(darkMode ? "dark" : "light");
    };
    const handleThemeChange = (event: Event) => {
      const { darkMode } = (event as CustomEvent<{ darkMode: boolean }>).detail;
      syncActiveTheme(darkMode);
    };

    window.addEventListener("theme-change", handleThemeChange);
    syncActiveTheme(document.documentElement.classList.contains("dark-mode"));
    return () => window.removeEventListener("theme-change", handleThemeChange);
  }, []);

  const animateSun = !reduceMotion && activeTheme === "light";
  const animateMoon = !reduceMotion && activeTheme === "dark";

  return (
    <span className="theme-icon-stack" aria-hidden="true">
      <span className="theme-icon theme-icon-sun">
        <Sun size={24} animate={animateSun} />
      </span>
      <span className="theme-icon theme-icon-moon-star">
        <MoonStar size={24} animate={animateMoon} />
      </span>
    </span>
  );
}
