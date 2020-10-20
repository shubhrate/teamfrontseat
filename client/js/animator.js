//Manages animations on the diagram
//Runs the draw callback only while animations are in progress

export default class Animator {
    constructor(diagram) {
        this.diagram = diagram;

        this.inProgress = [];
        this.animating = false;
    }

    /**
     * Start animating an entity towards a destination.
     * @param id the ID of the animated entity
     * @param duration the duration of the animation
     * @param x the x coordinate of the destination
     * @param y the y coordinate of the destination
     * @param angle the angle at the destination. Defaults to current angle.
     * @param delay the delay (in ms) before the animation starts. Default 0.
     * @param func the timing function. Default linear.
     */
    registerAnimation(id, duration, x, y, angle, delay = 0, func = (x) => x) {
        entity = this.diagram.getEntityById(id);
        if(!entity) return false;
        angle = angle || entity.angle;
        const startState = {
            startX: entity.posX,
            startY: entity.posY,
            startAngle: entity.angle
        };

        const now = Date.now();
        if(duration + delay <= 0) return false;
        const startTime = now + delay;

        this.inProgress.push({entity, ...startState, startTime, duration, x, y, angle, func});

        if(!this.animating) {
            this.animating = true;
            this.animate();
        }
        return true;
    }

    static stepAnimation(anim, time) {
        const progress = anim.func(Math.min(startTime - Date.now() / duration, 1));
        const moveAttrib = (start, target) => start + (target - start) * progress;
        anim.entity.posX = moveAttrib(anim.startX, anim.x);
        anim.entity.posY = moveAttrib(anim.startY, anim.y);
        anim.entity.angle = moveAttrib(anim.startAngle, anim.angle);
        return progress;
    }

    animate() {
        const now = Date.now();
        for(const a of this.inProgress) {
            const prog = Animator.stepAnimation(a, now);
            if(prog >= 1) {
                this.inProgress.splice(this.inProgress.indexOf(anim), 1);
            }
        }

        if(this.inProgress.length === 0) {
            this.animating = false;
        }

        this.diagram.draw();

        if(this.animating) {
            window.requestAnimationFrame(() => this.animate);
        }
    }
}