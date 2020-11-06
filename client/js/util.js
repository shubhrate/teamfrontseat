/**
 * Returns the hypotenuse of a right triangle given side lengths a and b.
 */
export function pythag(a, b) {
	return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
}

/**
 * Generates a unique identifier.
 */
export function uniqueID() {
	const datePart = Date.now().toString(16);
	const randPart = Math.round(Math.random() * 0x100000000).toString(16);
	return datePart + "-" + randPart;
}
/*
This is nonstandard, but should be robust enough to avoid collisions.
If we want to make this conform to a better standard (UUID being the best
candidate), or replace it with a library or node package, that better
solution can be dropped in without problems. But that's very low priority.
*/