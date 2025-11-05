import { useThemeContext } from '@/context/ThemeContext';

const useTheme = () => {
  const { theme, setTheme, isDarkMode, toggleDarkMode } = useThemeContext();
  
  return {
    theme,
    setTheme,
    isDarkMode,
    toggleDarkMode
  };
};

export default useTheme;