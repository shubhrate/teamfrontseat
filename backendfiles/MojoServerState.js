/*
 * MojoServerState
 *
 * Client-side copy of current state of Mojo Server.
 * The values of these variables are updated on receipt of
 * server responses that confirm changes to server state.
 *
 * source: { device: "Polhemus Patriot", fps: 30 },
 * format: { type: "RigidBody", orientation: "quaternion" },
 * bounds: { minX: -45.2445, maxX: 31.3632, 
 *           minY: -67.1919, maxY: -53.9842,
 *           minZ: -89.6014, maxZ: 266.253 }
 *
 * @author William Bares
 */
class MojoServerState
{
  constructor() {
		this.clear();
	}
	
	clear() {
		this.openedSensor = false;
		this.enabledReadSensor = false;
		this.enabledBroadcast = false;
		this.enabledRecord = false;		
  
    this.updateRate = 0;
    this.numRigidBodies = 0;

		this.source = { device: undefined, fps: 30 };
		this.dataFormat = { type: "RigidBody", orientation: "Euler" };
		this.bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
	}
}

// Export entire class by adding class name to global list of exports.
module.exports = MojoServerState;