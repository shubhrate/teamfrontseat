//Classes for movable entities on the Diagram.

/* The base entity class is a wrapper around a JSON object, which adds getters,
setters, and other conveniences. This makes it easy to instantiate an entity
from pure JSON from the server, and to hand only the relevant data back to it.
(The server, for instance, doesn't want to know an entity's current position in
screen space.)

Note that no entity knows how to draw itself; this is handled in Diagram, which
references into EntityDraw. The alternative to this is writing a wide
inheritance tree of classes to only override a draw function. That sounds
messy. But if that would actually be the better way to handle draws, I'll
gladly do that refactor.
*/
class Entity {
    /**
     * Creates an entity from an entity data object.
     * @param {Object} data this object's data
     */
    constructor(data) {
        this.data = data;

        this.selected = false;
        this.moved = false; //Flag for Diagram to update screen position

        //Screen space coordinates. For drawing on screen. Managed by Diagram.
        this.screenX = 0;
        this.screenY = 0;
        this.screenSize = 0;
    }

    //Getters and setters for position. Ignore them they're boring.
    get posX() {return this.data.posX;}
    get posY() {return this.data.posY;}
    get size() {return this.data.size;}
    get angle() {return this.data.angle;}
    set posX(val) {
        this.data.posX = val;
        this.moved = true;
    }
    set posY(val) {
        this.data.posY = val;
        this.moved = true;
    }
    set size(val) {
        this.data.size = val;
        this.moved = true;
    }
    set angle(val) {
        this.data.angle = val;
    } //Angle doesn't set this.moved because viewport doesn't rotate. (yet?)

    moveTo(x, y) {
        this.posX = x;
        this.posY = y;
    }
}

//The following classes will define behavior only relevant to that class.

class Actor extends Entity {}

class Prop extends Entity {}

class Scenery extends Entity {}

//Entity data declares what class it wants to be.
//This map lets it live that dream.
const entityClassMap = {
    "actor": Actor,
    "prop": Prop,
    "scenery": Scenery
};

export {Actor, Prop, Scenery};
export default entityClassMap;