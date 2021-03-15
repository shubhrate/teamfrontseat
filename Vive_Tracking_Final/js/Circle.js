/*
 * Class to represent a circle that can be drawn using HTML canvas.
 *
 * Read about how to format comments using the JsDoc standard.
 * If you format your method header comments in JsDoc convention, you 
 * can use the JsDoc utility to automatically generate HTML documentation pages for your code.
 * JsDoc performs the same role that the JavaDoc system does for Java.
 * Reference: https://devdocs.io/jsdoc/about-getting-started
 *
 * Tip - JavaScript methods and functions do not enforce type checking on 
 * argument lists.  Therefore, it is imperative that programmers carefully
 * document their method and functions so that everyone using the code
 * knows what any method should receive and return.
 */
class Circle
{
  /**
   * Represents a circle that can be drawn using HTML canvas.
   * @constructor
   * @param {integer} x - Center x-coordinate in pixels.
   * @param {integer} y - Center y-coordinate in pixels.
   * @param {integer} radius - Radius in pixels.
   * @param {string} colorStyle - HTML color given as "#ff00ff", for example.
   */
  constructor(x, y, radius, colorStyle)
	{
		// JavaScript can distinguish between this.x and x.
		// this.x is the class instance variable.  x is the formal argument variable.
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = colorStyle;
	}
	
  /**
   * Set the x-coordinate of the circle center.
   * @param {integer} x - Center x-coordinate in pixels.
   */
	setCenterX(x)
	{
		this.x = x;
	}
	
  /**
   * Set the y-coordinate of the circle center.
   * @param {integer} y - Center y-coordinate in pixels.
   */
	setCenterY(y)
	{
		this.y = y;
	}
	
  /**
   * Set the radius of the circle.
   * @param {integer} r - Radius in pixels.
   */
	setRadius(r)
	{
		this.radius = r;
	}
	
  /**
   * Set the circle fill color style attribute.
   * @param {string} colorStyle - HTML color given as "#ff00ff", for example.
   */
	setColor(colorStyle)
	{
		this.color = colorStyle;
	}
	
  /**
   * Get the center x-coordinate as an integer.
   * @return {integer} Circle center x-coordinate.
   */
	getCenterX()
	{
		return this.x;
	}
	
  /**
   * Get the center y-coordinate as an integer.
   * @return {integer} Circle center y-coordinate.
   */
	getCenterY()
	{
		return this.y;
	}
	
  /**
   * Get the radius as an integer.
   * @return {integer} Circle radius in pixels.
   */
	getRadius()
	{
		return this.radius;
	}
	
  /**
   * Get the circle fill color style.
   * @return {string} The message color style in the form "#ff00ff", for example.
   */
	getColor()
	{
	  return this.color;
	}
}