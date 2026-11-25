import { createContext, useContext } from 'react';

const LanguageContext = createContext(null);

export function LanguageProvider({ value, children }) {
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useAdminLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useAdminLanguage must be used inside LanguageProvider');
  return value;
}
