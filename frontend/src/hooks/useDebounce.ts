import { useState, useEffect } from 'react';

/**
 * Debounces a value by delaying updates until after `delay` ms have elapsed
 * since the last change. Useful for search inputs to avoid API calls on every keystroke.
 *
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds (default: 400ms)
 * @returns The debounced value
 *
 * @example
 * const debouncedSearch = useDebounce(searchInput, 400);
 * // Use debouncedSearch as query key / API param instead of raw searchInput
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
