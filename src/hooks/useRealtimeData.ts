"use client";

import { useEffect, useCallback, useState, useRef } from 'react';
import { useWebSocket, WebSocketMessage } from './useWebSocket';
import { useApiState, ApiActions } from './useApiState';
import { useToast } from './useToast';

export interface RealtimeDataOptions<T> {
  apiEndpoint: string;
  websocketUrl: string;
  websocketEvents: string[];
  onDataUpdate?: (data: T) => void;
  onNewItem?: (item: any) => void;
  onItemUpdate?: (item: any) => void;
  onItemDelete?: (itemId: string) => void;
  showNotifications?: boolean;
}

export function useRealtimeData<T = any>(
  options: RealtimeDataOptions<T>
): [any, ApiActions, boolean, boolean] {
  const [toasts, toastActions] = useToast();
  const [apiState, apiActions] = useApiState<T>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestTimeRef = useRef<number>(0);

  const {
    apiEndpoint,
    websocketUrl,
    websocketEvents,
    onDataUpdate,
    onNewItem,
    onItemUpdate,
    onItemDelete,
    showNotifications = true
  } = options;

  // Helper function to get the full API URL
  const getFullApiUrl = (endpoint: string) => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;
  };

  // Throttled and debounced fetch function to prevent multiple simultaneous requests
  const throttledFetch = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    
    // Throttle: Don't make requests more than once every 2 seconds
    if (timeSinceLastRequest < 2000) {
      console.log('Request throttled, too soon since last request');
      return;
    }

    if (isRequestInProgress) {
      console.log('Request already in progress, skipping...');
      return;
    }

    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce: Wait 500ms before making the request
    debounceTimeoutRef.current = setTimeout(async () => {
      setIsRequestInProgress(true);
      lastRequestTimeRef.current = Date.now();
      
      try {
        const response = await fetch(getFullApiUrl(apiEndpoint));
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        apiActions.setData(data);
      } catch (error) {
        console.error('API fetch error:', error);
        // Don't retry on authentication errors
        if (error instanceof Error && error.message.includes('401')) {
          console.log('Authentication required, stopping retries');
          return;
        }
      } finally {
        setIsRequestInProgress(false);
      }
    }, 500);
  }, [apiEndpoint, isRequestInProgress, apiActions]);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (!websocketEvents.includes(message.type)) {
      return;
    }

    switch (message.type) {
      case 'data_update':
        if (onDataUpdate) {
          onDataUpdate(message.data);
        }
        apiActions.setData(message.data);
        break;

      case 'item_created':
        if (onNewItem) {
          onNewItem(message.data);
        }
        if (showNotifications) {
          toastActions.showToast({
            type: 'success',
            title: 'New Item Created',
            message: `A new ${message.data.type || 'item'} has been created`
          });
        }
        // Refresh data
        throttledFetch();
        break;

      case 'item_updated':
        if (onItemUpdate) {
          onItemUpdate(message.data);
        }
        if (showNotifications) {
          toastActions.showToast({
            type: 'info',
            title: 'Item Updated',
            message: `${message.data.type || 'Item'} has been updated`
          });
        }
        // Refresh data
        throttledFetch();
        break;

      case 'item_deleted':
        if (onItemDelete) {
          onItemDelete(message.data.id);
        }
        if (showNotifications) {
          toastActions.showToast({
            type: 'warning',
            title: 'Item Deleted',
            message: `${message.data.type || 'Item'} has been deleted`
          });
        }
        // Refresh data
        throttledFetch();
        break;

      case 'security_event':
        if (showNotifications) {
          toastActions.showToast({
            type: 'error',
            title: 'Security Event',
            message: message.data.message || 'A security event has occurred',
            duration: 10000
          });
        }
        break;

      case 'audit_log':
        if (showNotifications && message.data.severity === 'high') {
          toastActions.showToast({
            type: 'warning',
            title: 'Audit Log',
            message: message.data.action || 'An important action has been logged',
            duration: 8000
          });
        }
        break;

      default:
        console.log('Unhandled WebSocket message:', message);
    }
  }, [websocketEvents, onDataUpdate, onNewItem, onItemUpdate, onItemDelete, showNotifications, apiActions, toastActions, apiEndpoint]);

  const [socket, socketActions, isConnected] = useWebSocket(websocketUrl, {
    onMessage: handleWebSocketMessage,
    onOpen: () => setIsWebSocketConnected(true),
    onClose: () => setIsWebSocketConnected(false),
    onError: (error) => {
      console.error('WebSocket error:', error);
      if (showNotifications) {
        toastActions.showToast({
          type: 'error',
          title: 'Connection Error',
          message: 'Lost connection to real-time updates'
        });
      }
    }
  });

  // Initial data fetch - only once when component mounts
  useEffect(() => {
    throttledFetch();
  }, [apiEndpoint]); // Remove apiActions from dependencies to prevent re-runs

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return [apiState, apiActions, isConnected, isWebSocketConnected];
}

export default useRealtimeData;
