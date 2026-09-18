import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: 'PRODUCT_CREATED' | 'PRODUCT_UPDATED' | 'PRODUCT_DELETED'
      | 'BANNER_CREATED' | 'BANNER_UPDATED' | 'BANNER_DELETED'
      | 'ORDER_CREATED' | 'ORDER_UPDATED'
      | string;
  data: any;
}

export function useRealtimeWebSocket(
  onMessage: (msg: WebSocketMessage) => void,
  authKey?: string,
  onReconnect?: () => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const attemptRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  const onReconnectRef = useRef(onReconnect);
  const hasOpenedBeforeRef = useRef(false);
  const isUnmountedRef = useRef(false);

  // Mantener la referencia del callback siempre actualizada sin reiniciar el socket
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  const connect = useCallback(() => {
    if (typeof window === 'undefined' || isUnmountedRef.current) return;

    // Limpiar timers pendientes
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      // El token permite al backend enviar solo los eventos que este usuario puede ver
      const token = localStorage.getItem('catalog_saas_jwt_token');
      const wsUrl = `${protocol}//${host}/api/ws` + (token ? `?token=${encodeURIComponent(token)}` : '');

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close(1000, 'Unmounted');
          return;
        }

        setIsConnected(true);
        attemptRef.current = 0;

        // En una reconexión (o cambio de sesión) pedimos el estado actual,
        // porque los eventos emitidos mientras no estábamos conectados se perdieron.
        if (hasOpenedBeforeRef.current) {
          try { onReconnectRef.current?.(); } catch { /* noop */ }
        }
        hasOpenedBeforeRef.current = true;

        // Iniciar latido (heartbeat) cada 25 segundos para mantener proxies y túneles activos
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const parsed = JSON.parse(event.data) as WebSocketMessage;
          if (parsed && parsed.type) {
            onMessageRef.current(parsed);
          }
        } catch {
          // Ignorar mensajes no JSON
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // Si se cerró intencionalmente (código 1000) o el componente ya se desmontó, no reintentar
        if (isUnmountedRef.current || event.code === 1000) {
          return;
        }

        // Reintento con retroceso exponencial (1.5s, 3s, 6s... máx 20s)
        const delay = Math.min(20000, 1500 * Math.pow(1.5, attemptRef.current));
        attemptRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };

      ws.onerror = () => {
        // ws.close() se llamará automáticamente después de error
      };
    } catch {
      if (isUnmountedRef.current) return;
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    }
  }, []);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

      const ws = wsRef.current;
      if (ws) {
        // Desactivar callbacks para que la desconexión del ciclo de vida de React no dispare errores
        ws.onclose = null;
        ws.onerror = null;

        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Component unmounted');
        } else if (ws.readyState === WebSocket.CONNECTING) {
          // Si React desmonta el componente antes de terminar el handshake (ej: React 18 StrictMode),
          // esperar a que abra para cerrar limpiamente sin lanzar la advertencia en consola
          ws.onopen = () => {
            ws.close(1000, 'Component unmounted');
          };
        }
      }
    };
  }, [connect]);

  // Reconectar cuando el usuario inicia o cierra sesión, para que el backend
  // reciba el token nuevo y envíe los eventos correctos (pedidos, pagos, etc.)
  const firstAuthRef = useRef(true);
  useEffect(() => {
    if (firstAuthRef.current) {
      firstAuthRef.current = false;
      return;
    }
    const ws = wsRef.current;
    if (ws) {
      ws.onclose = null;
      ws.onerror = null;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Auth changed');
      }
    }
    setIsConnected(false);
    attemptRef.current = 0;
    connect();
  }, [authKey, connect]);

  return { isConnected };
}
