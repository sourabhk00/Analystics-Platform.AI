import { useEffect, useRef, useState } from 'react';
import { wsClient } from '@/lib/websocket';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const connect = async () => {
      try {
        await wsClient.connect();
        setIsConnected(true);
        setConnectionError(null);
      } catch (error) {
        setConnectionError(error instanceof Error ? error.message : 'Connection failed');
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      wsClient.disconnect();
      setIsConnected(false);
    };
  }, []);

  return {
    isConnected,
    connectionError,
    send: wsClient.send.bind(wsClient),
    on: wsClient.on.bind(wsClient),
    off: wsClient.off.bind(wsClient),
  };
}

export function useWebSocketEvent<T = any>(
  event: string, 
  callback: (data: T) => void,
  dependencies: React.DependencyList = []
) {
  const callbackRef = useRef(callback);
  
  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, dependencies);

  useEffect(() => {
    const handler = (data: T) => {
      callbackRef.current(data);
    };

    wsClient.on(event, handler);

    return () => {
      wsClient.off(event, handler);
    };
  }, [event]);
}
