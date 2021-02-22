# This opens a websocket server at the specified localhost number and sends the tracking data
import asyncio
import websockets
import triad_openvr
import time
import sys
import openvr


v = triad_openvr.triad_openvr()

# Checks if tracker is detected
if len(sys.argv) == 1:
    # Sets the update interval per second
    interval = 1/30
else:
    print("Invalid number of arguments")
    interval = False

# Gets the size of the current play area in meters
# sizeOfArea = triad_openvr.IVRChaperone.getPlayAreaSize(v)
sizeOfArea = openvr.IVRChaperone.getPlayAreaSize


# Sends the data automatically. Might need to specify when we want to start sending the data
async def server(websocket, path):
    if interval:
        while(True):
            start = time.time()
            txt = ""
            count = 0
            for each in v.devices["tracker_1"].get_pose_euler():
                count += 1
                # This gets the correct rotation for an upright tracker
                if count != 4 and count !=5:
                    txt += "%.4f" % each
                    txt += "  "
            # Format -> x y z rotation
            await websocket.send(txt)
            sleep_time = interval-(time.time()-start)
            if sleep_time>0:
                time.sleep(sleep_time)

start_server = websockets.serve(server, "localhost", 9003)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()