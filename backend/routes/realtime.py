from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.realtime_service import manager

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)

    try:
        while True:
            message = await websocket.receive_text()
            print(f"[WS] received from client: {message}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"[WS] endpoint error: {e}")
        manager.disconnect(websocket)