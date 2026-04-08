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
      console.log("[WS] connecting:", wsUrl);

      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log("[WS] connected");
        handlers.onOpen?.();

        pingInterval = setInterval(() => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            try {
              socket.send("ping");
            } catch {
              // ignore
            }
          }
        }, 15000);
      };

      socket.onmessage = (event) => {
        console.log("[WS] raw message:", event.data);

        try {
          const parsed = JSON.parse(event.data);
          console.log("[WS] parsed message:", parsed);
          handlers.onMessage?.(parsed);
        } catch {
          // ping vb. parse edilemeyen mesajları sessiz geç
        }
      };

      socket.onerror = (event) => {
        console.log("[WS] error");
        handlers.onError?.(event);
      };

      socket.onclose = () => {
        console.log("[WS] closed");
        cleanup();
        handlers.onClose?.();

        if (!closedManually) {
          reconnectTimeout = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    } catch {
      console.log("[WS] connect failed");
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