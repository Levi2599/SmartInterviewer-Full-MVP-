import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem('pref-lang') || 'en'
  );

  const applyLanguage = (lang) => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  };

  // Apply on mount and whenever language changes
  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  const setLanguage = (lang) => {
    localStorage.setItem('pref-lang', lang);
    setLanguageState(lang);
  };

  const t = (key) => translations[language]?.[key] ?? translations['en'][key] ?? key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
