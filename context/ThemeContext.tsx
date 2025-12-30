import React, { createContext, useContext, useEffect, useState } from 'react';

type Tema = 'dark' | 'light';

interface ContextoTema {
  tema: Tema;
  alternarTema: () => void;
}

const ThemeContext = createContext<ContextoTema | undefined>(undefined);

export const ProvedorTema: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tema, setTema] = useState<Tema>('dark');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(tema);
  }, [tema]);

  const alternarTema = () => {
    setTema((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTema = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTema deve ser usado dentro de um ProvedorTema');
  }
  return context;
};