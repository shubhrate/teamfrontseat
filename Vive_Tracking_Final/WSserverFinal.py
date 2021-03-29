# This opens a websocket server at the specified localhost number and sends the tracking data
import asyncio
import websockets
import triad_openvr
import time
import sys
import openvr
import json
import math

v = triad_openvr.triad_openvr()

# Checks if tracker is detected
if len(sys.argv) == 1:
    # Sets the update interval per second
    interval = 1/30
else:
    print("Invalid number of arguments")
    interval = False

# There is something weird going on here where it doesnt actually return the size?
# Gets the size of the current play area in meters
# sizeOfArea = triad_openvr.IVRChaperone.getPlayAreaSize(v)
sizeOfWidth = openvr.IVRChaperone.getPlayAreaSize
size = openvr.IVRChaperone.getPlayAreaSize
#sizeOfHeight = openvr.chaperone.getPlayAreSize()
print(sizeOfWidth)
#print(sizeOfHeight)

async def server(websocket, path):
    if interval:
        
        while(True):
            start = time.time()
            count = 0
            txt_json = {
                'time' : start,
                'channels' : [
                      {'id' : '178376c5ebe-0ed6977d', 'pos' : {}, 'rot' : {}}  
                ]
            }
            for each in v.devices["tracker_1"].get_pose_euler():
                if count == 0:
                    txt_json['channels'][0]['pos']['x'] = each
                if count == 1:
                    txt_json['channels'][0]['pos']['y'] = 0
                if count == 2:
                    txt_json['channels'][0]['pos']['z'] = each
                if count == 3:
                    txt_json['channels'][0]['rot']['x'] = 0
                if count == 4:
                    each = math.radians(each)
                    txt_json['channels'][0]['rot']['y'] = each
                # For an upright tracker, we want the value in pos 4
                if count == 5:
                    txt_json['channels'][0]['rot']['z'] = 0
                count += 1
            txt = json.dumps(txt_json)
            
            await websocket.send(txt)
            # await websocket.recv()
            # Need to add in the above line once connected to the server. 
            # The below line is a temporary fix.
            await asyncio.sleep(interval)
            print(txt)

            sleep_time = interval-(time.time()-start)
            if sleep_time>0:
                time.sleep(sleep_time)
# IP address of the computer running the vive tracking server
# Each tracker client will need to change this to be the IP of their computer
start_server = websockets.serve(server, "192.168.1.5", 9003)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()