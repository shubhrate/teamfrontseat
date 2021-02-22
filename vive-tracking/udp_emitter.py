# This program prints out the tracking data. (Does not start a websocket server)
import triad_openvr
import time
import sys
import websockets
import asyncio


v = triad_openvr.triad_openvr()
#v.print_discovered_objects()

if len(sys.argv) == 1:
    interval = 1/30 #1/250
elif len(sys.argv) == 2:
    interval = 1/float(sys.argv[1])
else:
    print("Invalid number of arguments")
    interval = False
    
if interval:
    while(True):
        start = time.time()
        txt = ""
        count = 0
        #size = v.getPlayAreaSize()
        for each in v.devices["tracker_1"].get_pose_euler():
            count += 1
            # For an upright tracker, we want the value in pos 5
            if count != 4 and count != 6:
                txt += "%.4f" % each
                txt += "  "
        print("\r" + txt, end="")

        sleep_time = interval-(time.time()-start)
        if sleep_time>0:
            time.sleep(sleep_time)