"use client";

import { useState, useCallback } from 'react';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface ApiActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setData: <T>(data: T | null) => void;
  clearError: () => void;
  execute: <T>(
    apiCall: () => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: Error) => void
  ) => Promise<T | null>;
}

export function useApiState<T = any>(initialData: T | null = null): [ApiState<T>, ApiActions] {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const execute = useCallback(async <T>(
    apiCall: () => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiCall();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const actions: ApiActions = {
    setLoading,
    setError,
    setData: (data: any) => setData(data),
    clearError,
    execute
  };

  return [{ data, loading, error }, actions];
}

export default useApiState;
