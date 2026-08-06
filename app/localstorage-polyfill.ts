// app/localstorage-polyfill.ts
"use client";

import { useEffect } from "react";

export function LocalStoragePolyfill() {
  useEffect(() => {
    // Si localStorage no está disponible, crear un polyfill
    if (typeof window !== 'undefined' && !window.localStorage) {
      console.warn('localStorage no disponible, creando polyfill en memoria');
      
      const memoryStorage: { [key: string]: string } = {};
      
      window.localStorage = {
        getItem: (key: string) => memoryStorage[key] || null,
        setItem: (key: string, value: string) => {
          memoryStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete memoryStorage[key];
        },
        clear: () => {
          Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]);
        },
        key: (index: number) => Object.keys(memoryStorage)[index] || null,
        get length() {
          return Object.keys(memoryStorage).length;
        },
      };
    }
  }, []);

  return null;
}