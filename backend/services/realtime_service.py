from typing import List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] client connected, total={len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WS] client disconnected, total={len(self.active_connections)}")

    async def broadcast_json(self, payload: dict):
        print(
            f"[WS] broadcasting payload={payload} to total={len(self.active_connections)}"
        )

        stale_connections = []

        for connection in self.active_connections:
            try:
                await connection.send_json(payload)
            except Exception as e:
                print(f"[WS] send failed: {e}")
                stale_connections.append(connection)

        for connection in stale_connections:
            self.disconnect(connection)


manager = ConnectionManager()


async def publish_event(event_type: str, data: dict | None = None):
    payload = {
        "type": event_type,
        "data": data or {},
    }
    await manager.broadcast_json(payload)