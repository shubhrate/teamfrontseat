import triad_openvr
import openvr
import time
import sys


v = triad_openvr.triad_openvr()
#vr = openvr.init(openvr.VRApplication_Background)
#v.print_discovered_objects()

if len(sys.argv) == 1:
    interval = 1/30 #1/250
elif len(sys.argv) == 2:
    interval = 1/float(sys.argv[1])
else:
    # When no devices are detected
    print("Invalid number of arguments")
    interval = False
    
sizeOfArea = triad_openvr.IVRChaperone.getPlayAreaSize(v)
#convert meters to cm
print(sizeOfArea)
if interval:
    while(True):
        start = time.time()
        txt = ""
        count = 0
        
        for each in v.devices["tracker_1"].get_pose_euler():
            count += 1
            # This is for an upright tracker
            if count != 4 and count != 5:
                txt += "%.4f" % each
                txt += "  "
            
        print("\r" + txt, end="")
        sleep_time = interval-(time.time()-start)
        if sleep_time>0:
            time.sleep(sleep_time)