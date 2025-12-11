"use client";

import { useEffect } from "react";

export default function ThemeScript() {
  useEffect(() => {
    // Carregar tema do localStorage ao montar
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              const theme = localStorage.getItem('theme');
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {
              console.error('Erro ao carregar tema:', e);
            }
          })();
        `,
      }}
    />
  );
}
