// hooks/useLoading.ts
import { useState, useEffect } from 'react';

export const useLoading = (duration: number = 1500) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  return { isLoading, setIsLoading };
};