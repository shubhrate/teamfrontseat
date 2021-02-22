# This tests to see if webclients can communicate with the vive websocket server
import asyncio
import websockets
import triad_openvr
import time
import sys

connected = set()

v = triad_openvr.triad_openvr()

async def server(websocket, path):
    # Register
    #    async for message in websocket:
    #        await websocket.send(f"got your message its: {message}")
    connected.add(websocket)
    try:
        async for message in websocket:
            for conn in connected:
                await conn.send(f'Got a new MSG for you: {message}')
    finally:
        # Unregister
        connected.remove(websocket)

start_server = websockets.serve(server, "localhost", 9003)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()