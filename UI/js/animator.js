//Manages animations on the diagram
//Runs the draw callback only while animations are in progress

//TODO: just fucking tear this whole system down and rewrite it, I mean Jesus Christ man

import {pythag, interpolate} from "./util.js";

export default class Animator {
		constructor(diagram) {
		this.diagram = diagram;
		this.inProgress = [];
		this.animating = false;
	}

	///////////////////////////////////
	//FUNCTIONS FOR CREATING ANIMATIONS OF DIFFERENT TYPES

	//TODO: this whole category of functions should be reconsidered, in
	//particular whether parameters ought to be spread out like this or
	//should it just be handed one field with the necessary data in JSON

	addAnimation(type, entity, duration, delay, func, data) {
		const startTime = Date.now() + delay;

		//NOTE: here's the spec of a generic animation object
		//data stores the actual motion, in a different form for every type
		const animationObject = {
			type,
			entity,
			startTime,
			duration,
			func,
			...data
		};

		this.inProgress.push(animationObject);
		this.startAnimating();
		return animationObject;
	}

	/**
	 * Animate an entity from its current position in a line to a destination.
	 * @param entity the entity to animate
	 * @param duration the duration of the animation
	 * @param x the x coordinate of the destination
	 * @param y the y coordinate of the destination
	 * @param angle the angle at the destination. Defaults to current angle.
	 * @param delay the delay (in ms) before the animation starts. Default 0.
	 * @param func the timing function. Default linear.
	 * @returns the animation object
	 */
	animateCross(entity, duration, x, y, angle, delay = 0, func = (x) => x) {
		angle = angle || entity.angle;
		const data = {
			startX: entity.posX,
			startY: entity.posY,
			startAngle: entity.angle,
			x, y, angle
		};

		return this.addAnimation("cross", entity, duration, delay, func, data);
	}

	animatePath(entity, duration, xCoords, yCoords, delay = 0, func = (x) => x) {
		if(xCoords.length !== yCoords.length) return;
		xCoords.unshift(entity.posX);
		yCoords.unshift(entity.posY);

		//Calculate the lengths of all moves
		let distances = [0];
		for(let p = 1; p < xCoords.length; p++) {
			const d = pythag(xCoords[p] - xCoords[p - 1], yCoords[p] - yCoords[p - 1]);
			distances.push(d);
		}
		const pathLength = distances.reduce((total, current) => total + current);

		//Populate array of segment ratios (progress ratio where segments begin)
		let segmentRatios = [];
		let distToHere = 0;
		for(const d of distances) {
			distToHere += d;
			segmentRatios.push(distToHere / pathLength);
		}

		//TODO: handle angles

		const data = {xCoords, yCoords, segmentRatios};
		return this.addAnimation("path", entity, duration, delay, func, data);
	}

	animateMotion() {

	}

	///////////////////////////////////
	//FUNCTIONS HANDLING ANIMATIONS OF DIFFERENT TYPES

	static progressAlongLine(entity, x1, y1, x2, y2, progress) {
		entity.posX = x1 + (x2 - x1) * progress;
		entity.posY = y1 + (y2 - y1) * progress;
	}

	static stepCross(anim, progress) {
		Animator.progressAlongLine(anim.entity, anim.startX, anim.startY, anim.x, anim.y, progress);
		//TODO: handle angles
	}

	static stepPath(anim, progress) {
		let p = 0;
		while(anim.segmentRatios[p + 1] < progress) p++;
		const segProgress = (progress - anim.segmentRatios[p]) / (anim.segmentRatios[p + 1] - anim.segmentRatios[p]);
		Animator.progressAlongLine(anim.entity, anim.xCoords[p], anim.yCoords[p], anim.xCoords[p + 1], anim.yCoords[p + 1], segProgress);
		//TODO: handle angles
	}

	static stepMotion(anim, progress) {

	}

	///////////////////////////////////
	//FUNCTIONS ACTUALLY MANAGING ANIMATIONS

	startAnimating() {
		if (!this.animating && this.inProgress.length > 0) {
			this.animating = true;
			this.animatorCallback();
		}
	}

	animatorCallback() {
		const stepFunctions = {
			"cross": Animator.stepCross,
			"path": Animator.stepPath,
			"motion": Animator.stepMotion
		}

		const now = Date.now();
		for(const a of this.inProgress) {
			if (a.startTime <= now) {
				const progress = a.func(Math.min((now - a.startTime) / a.duration, 1));
				stepFunctions[a.type](a, progress);
				if(progress >= 1) { //Stop tracking this animation if it's done
					this.inProgress.splice(this.inProgress.indexOf(a), 1);
				}
			}
		}

		this.diagram.draw();

		if(this.inProgress.length === 0) {
			this.animating = false;
		} else if(this.animating) {
			window.requestAnimationFrame(() => this.animatorCallback());
		}
	}
}