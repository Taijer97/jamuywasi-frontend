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
  // Si el servidor no responde "pong" a tiempo, la conexión está muerta aunque el navegador no lo sepa
  // (pasa al cambiar de wifi a datos o al desbloquear el celular): la cerramos para reconectar.
  const pongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
            if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);
            pongTimeoutRef.current = setTimeout(() => {
              // Sin respuesta en 10 s: conexión colgada -> forzar reconexión
              try { ws.close(4000, 'Heartbeat timeout'); } catch { /* noop */ }
            }, 10000);
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        if (event.data === 'pong') {
          if (pongTimeoutRef.current) { clearTimeout(pongTimeoutRef.current); pongTimeoutRef.current = null; }
          return;
        }
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
        if (pongTimeoutRef.current) { clearTimeout(pongTimeoutRef.current); pongTimeoutRef.current = null; }

        // Si se cerró intencionalmente (código 1000) o el componente ya se desmontó, no reintentar
        if (isUnmountedRef.current || event.code === 1000) {
          return;
        }

        // Reintento con retroceso exponencial (1.5s, 3s, 6s... máx 20s)
        // + azar (jitter) para que, si el servidor se reinicia, no reconecten todos al mismo tiempo
        const delay = Math.min(20000, 1500 * Math.pow(1.5, attemptRef.current)) + Math.random() * 1000;
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
      if (pongTimeoutRef.current) clearTimeout(pongTimeoutRef.current);

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

  // Reconectar de inmediato cuando vuelve la red o el usuario regresa a la pestaña/app,
  // en lugar de esperar al siguiente reintento (que puede tardar hasta 20 s).
  useEffect(() => {
    const reconnectNow = () => {
      const ws = wsRef.current;
      const alive = ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING);
      if (alive || isUnmountedRef.current) return;
      attemptRef.current = 0;
      connect();
    };
    const onVisible = () => { if (document.visibilityState === 'visible') reconnectNow(); };
    window.addEventListener('online', reconnectNow);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', reconnectNow);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [connect]);

  // Reconectar cuando el usuario inicia o cierra sesión, para que el backend
  // reciba el token nuevo y envíe los eventos correctos (pedidos, pagos, etc.)
  // Se compara con el valor anterior (no con un "primer render"), así en modo desarrollo
  // (React StrictMode ejecuta los efectos dos veces) no se abre una conexión de más.
  const prevAuthKeyRef = useRef(authKey);
  useEffect(() => {
    if (prevAuthKeyRef.current === authKey) return;
    prevAuthKeyRef.current = authKey;
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
