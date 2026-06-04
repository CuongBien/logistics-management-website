'use client';

import { useState, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T>(
  fetcher: (...args: unknown[]) => Promise<T>,
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await fetcher(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setState({ data: null, loading: false, error: message });
        return null;
      }
    },
    [fetcher],
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
