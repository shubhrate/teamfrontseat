//A map of draw functions for specific entities.
//See entity.js to learn why it's this way.

const SELECT_COLOR = "#3498db";
const CONTROLLED_COLOR = "#e74c3c";

const ACTOR_ARROW_LENGTH = 0.8;
const ACTOR_ARROW_ARC = 0.55;

const LABEL_FONT_SCALE = 0.4;
const LABEL_DIST_SCALE = 1;

function drawLabel(ent, ctx, label) {
	ctx.fillStyle = "black";
	ctx.font = `${ent.screenSize * LABEL_FONT_SCALE}px sans-serif`;
	const dist = ent.screenSize / 2 * LABEL_DIST_SCALE;
	ctx.fillText(label, ent.screenX + dist, ent.screenY - dist);
}

const EntityDraw = {
	"actor": function(ent, ctx) {
		//Draw arrow
		ctx.fillStyle = ent.data.color2;
		const length = ACTOR_ARROW_LENGTH * ent.screenSize;
		ctx.beginPath();
		ctx.moveTo(
			length * Math.cos(ent.angle) + ent.screenX,
			length * Math.sin(ent.angle) + ent.screenY
		);
		ctx.lineTo(
			ent.screenSize / 2 * Math.cos(ent.angle + ACTOR_ARROW_ARC) + ent.screenX,
			ent.screenSize / 2 * Math.sin(ent.angle + ACTOR_ARROW_ARC) + ent.screenY
		);
		ctx.lineTo(
			ent.screenSize / 2 * Math.cos(ent.angle - ACTOR_ARROW_ARC) + ent.screenX,
			ent.screenSize / 2 * Math.sin(ent.angle - ACTOR_ARROW_ARC) + ent.screenY
		);
		ctx.closePath();
		ctx.fill();

		//Draw circle
		ctx.fillStyle = ent.data.color;
		ctx.beginPath();
		ctx.arc(ent.screenX, ent.screenY, ent.screenSize / 2, 0, 2 * Math.PI);
		ctx.fill();

		//Draw outline if selected or controlled
		if (ent.selected || ent.hasController) {
			ctx.lineWidth = 2.5;
			ctx.strokeStyle = ent.hasController ? CONTROLLED_COLOR : SELECT_COLOR;
			ctx.beginPath();
			ctx.arc(ent.screenX, ent.screenY, ent.screenSize / 2, 0, 2 * Math.PI);
			ctx.stroke();
		}

		drawLabel(ent, ctx, ent.data.name);
	},


	"furn_chair": function(ent, ctx) {
		ctx.fillStyle = ent.data.color;
		ctx.strokeStyle = ent.data.color2;
		if(ent.selected) ctx.strokeStyle = SELECT_COLOR;
		if(ent.hasController) ctx.strokeStyle = CONTROLLED_COLOR;

		ctx.lineWidth = 2;
		const width = ent.screenSize / Math.sqrt(2); //Shape is within bounding circle

		//We do rotations to this one
		ctx.translate(ent.screenX, ent.screenY);
		ctx.rotate(ent.angle);
		ctx.translate(-ent.screenX, -ent.screenY);

		const corner = [ent.screenX - width / 2, ent.screenY - width / 2];
		const fullRect = [...corner, width, width];
		const backRect = [...corner, width * 0.1, width];

		ctx.fillRect(...fullRect);
		ctx.strokeRect(...fullRect);
		ctx.strokeRect(...backRect);

		ctx.setTransform(1, 0, 0, 1, 0, 0);

		drawLabel(ent, ctx, ent.data.name);
	}

	//etc etc...
};

export default EntityDraw;