/**
 * Returns the hypotenuse of a right triangle given side lengths a and b.
 * @param {number} a
 * @param {number} b
 */
export function pythag(a, b) {
	return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
}

/**
 * Generates a unique identifier.
 */
export function uniqueID() {
	const datePart = Date.now().toString(16);
	const randPart = Math.floor(Math.random() * 0x100000000).toString(16);
	return datePart + "-" + randPart;
}
/*
This is nonstandard, but should be robust enough to avoid collisions.
If we want to make this conform to a better standard (UUID being the best
candidate), or replace it with a library or node package, that better
solution can be dropped in without problems. But that's very low priority.
*/

/**
 * Do a bit of linear interpolation.
 * @param {number} x current x value for which a y should be found
 * @param {number} x1 x value of left point
 * @param {number} x2 x value of right point
 * @param {number} y1 y value of left point
 * @param {number} y2 y value of right point
 */
export function interpolate(x, x1, x2, y1, y2) {
	const ratio = (x - x1) / (x2 - x1);
	return (y2 - y1) * ratio + y1;
}