type RealtimeEvent = {
  type: string;
  data?: Record<string, any>;
};

type RealtimeHandlers = {
  onMessage?: (event: RealtimeEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
};

function getWsBase(): string {
  if (typeof window === "undefined") return "";

  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  return isLocal
    ? "ws://127.0.0.1:8001/ws"
    : "wss://panoplog-production.up.railway.app/ws";
}

export function connectRealtime(handlers: RealtimeHandlers = {}) {
  const wsUrl = getWsBase();
  let socket: WebSocket | null = null;
  let pingInterval: ReturnType<typeof setInterval> | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let closedManually = false;

  const cleanup = () => {
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  const connect = () => {
    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        handlers.onOpen?.();

        pingInterval = setInterval(() => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            try {
              socket.send("ping");
            } catch {
              // sessiz geç
            }
          }
        }, 15000);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          handlers.onMessage?.(parsed);
        } catch {
          // ping veya parse edilemeyen mesajları sessiz geç
        }
      };

      socket.onerror = (event) => {
        // DEV overlay açmaması için burada console.error YOK
        handlers.onError?.(event);
      };

      socket.onclose = () => {
        cleanup();
        handlers.onClose?.();

        if (!closedManually) {
          reconnectTimeout = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    } catch {
      // bağlantı kurulamazsa sessiz geç ve tekrar dene
      if (!closedManually) {
        reconnectTimeout = setTimeout(() => {
          connect();
        }, 3000);
      }
    }
  };

  connect();

  return {
    close() {
      closedManually = true;
      cleanup();
      if (socket) {
        socket.close();
      }
    },
  };
}