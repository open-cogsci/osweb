import Styles from '../backends/styles.js'
import Canvas from '../backends/canvas.js'

/**
 * The `Canvas` class is used to present visual stimuli. You generally
 * create a `Canvas` object with the `Canvas()` factory function. Because
 * `Canvas()` is a function, you do *not* need to use `new` when calling it.
 * The JavaScript `Canvas` class mimicks the corresponding Python `Canvas`
 * class.
 * 
 * __Style keywords__ can be passed to all functions that accept `styleArgs`.
 * Style keywords can also be set as properties of the `Canvas` object. For an
 * overview of style keywords, see the
 * [Python `Canvas` documentation](%url:manual/python/canvas%).
 * 
 * __Important:__ JavaScript doesn't support named parameters (or: keywords).
 * Therefore, parameters are passed an `Object` with named properties and
 * default values. Like so:
 *
 * ```js
 * var myCanvas = Canvas()
 * // (correct) pass parameters as an Object ...
 * myCanvas.fixdot({color: 'red'})
 * // (incorrect) ... and *not* as named parameters
 * // myCanvas.fixdot(color='red')
 * myCanvas.show()
 * ```
 *
 * [TOC]
 *
 * @class
 * @name Canvas
 **/ 
export default class CanvasHandler {

  constructor (experiment, styleArgs = {}) {
    this._style = new Styles(experiment)
    this._canvas = new Canvas(experiment)
    this._canvas._styles = this._style
    Object.assign(this._style, styleArgs)
    this._xc = this._canvas.width / (2 * experiment._scale_x)
    this._yc = this._canvas.height / (2 * experiment._scale_y)
  }
  
  get color() {return this._style.color}
  set color(val) {this._style.color = val}
  get background_color() {return this._style.background_color}
  set background_color(val) {this._style.background_color = val}
  get fill() {return this._style.fill}
  set fill(val) {this._style.fill = val}
  get html() {return this._style.html}
  set html(val) {this._style.html = val}
  get font_family() {return this._style.font_family}
  set font_family(val) {this._style.font_family = val}
  get font_size() {return this._style.font_size}
  set font_size(val) {this._style.font_size = val}
  get font_italic() {return this._style.font_italic}
  set font_italic(val) {this._style.font_italic = val}
  get font_bold() {return this._style.font_bold}
  set font_bold(val) {this._style.font_bold = val}
  get font_underline() {return this._style.font_underline}
  set font_underline(val) {this._style.font_underline = val}
  
  _element_style (styleArgs) {
    if (typeof styleArgs === "undefined") {
      return this._style
    }
    const style = new Styles()
    Object.assign(style, this._style)
    Object.assign(style, styleArgs)
    return style
  }
  
  /**
   * Draws an arrow. An arrow is a polygon consisting of 7 vertices, with an
   * arrowhead pointing at (ex, ey).
   *
   * @example
   * var myCanvas = Canvas()
   * var w = vars.width / 2
   * var h = vars.height / 2
   * // Important: parameters are passed as an Object
   * myCanvas.arrow({sx: 0, sy: 0, w: w, h: h, head_width:100, body_length:0.5})
   *
   * @param {Object} obj
   * @param {Number} obj.sx=0
   * @param {Number} obj.sy=0
   * @param {Number} obj.ex=50
   * @param {Number} obj.ey=0
   * @param {Number} obj.body_length=0.8
   * @param {Number} obj.body_width=0.5
   * @param {Number} obj.head_width=30
   * @param {Object} ..obj.styleArgs={}
   *
   * @name Canvas.arrow
   * @function
   **/
  arrow({sx = 0, sy = 0, ex = 50, ey = 0, body_length = 0.8, body_width = 0.5,
      head_width = 30, ...styleArgs} = {}) {
    this._canvas.arrow(
        sx + this._xc,
        sy + this._yc,
        ex + this._xc,
        ey + this._yc,
        body_width,
        body_length,
        head_width,
        this._element_style(styleArgs))
  }
  
  /**
   *	 Clears the canvas with the current background color. Note that it is
   *	 generally faster to use a different canvas for each experimental
   *	 display than to use a single canvas and repeatedly clear and redraw
   *	 it.
   *
   * @example
   * var myCanvas = Canvas()
   * myCanvas.fixdot({color: 'green'})
   * myCanvas.show()
   * // do something
   * myCanvas.clear()
   * myCanvas.fixdot({color: 'red'})
   * myCanvas.show()
   *
   * @param {Object} [styleArgs={}]
   * @name Canvas.clear
   * @function
   **/
  clear(styleArgs = {}) {
    this._canvas.clear(this._element_style(styleArgs).background_color)
  }
  
  /**
   * Draws a circle.
   *
   * @example
   * var myCanvas = Canvas()
   * myCanvas.circle({x: 100, y: 100, r: 50, fill: true, color:'red'})
   *
   * @param {Object} obj
   * @param {Number} obj.x=0
   * @param {Number} obj.y=0
   * @param {Number} obj.r=50
   * @param {Object} ..obj.styleArgs={}
   *
   * @name Canvas.circle
   * @function
   **/
  circle({x = 0, y = 0, r = 50, ...styleArgs} = {}) {
    this._canvas.circle(
        x + this._xc,
        y + this._yc,
        r,
        this._element_style(styleArgs))
  }

  /**
   * Draws an ellipse.
   *
   * @example
   * var myCanvas = Canvas()
   * myCanvas.ellipse({x: -10, y: -10, w: 20, h: 20, fill:true})
   *
   * @param {Object} obj
   * @param {Number} obj.x=-50
   * @param {Number} obj.y=-25
   * @param {Number} obj.w=100
   * @param {Number} obj.h=50
   * @param {Object} ..obj.styleArgs={}
   *
   * @name Canvas.ellipse
   * @function
   **/
  ellipse({x = -50, y = -25, w = 100, h = 50, ...styleArgs} = {}) {
    this._canvas.ellipse(
        x + this._xc,
        y + this._yc,
        w,
        h,
        this._element_style(styleArgs))
  }
  
  /**
   * Draws a fixation dot. The default style is medium-open.
   * 
   * - 'large-filled' is a filled circle with a 16px radius.
   * - 'medium-filled' is a filled circle with an 8px radius.
   * - 'small-filled' is a filled circle with a 4px radius.
   * - 'large-open' is a filled circle with a 16px radius and a 2px hole.
   * - 'medium-open' is a filled circle with an 8px radius and a 2px hole.
   * - 'small-open' is a filled circle with a 4px radius and a 2px hole.
   * - 'large-cross' is 16px cross.
   * - 'medium-cross' is an 8px cross.
   * - 'small-cross' is a 4px cross.
   *
   * @example
   * var myCanvas = Canvas()
   * myCanvas.fixdot()
   *
   * @param {Object} obj
   * @param {Number} obj.x=0
   * @param {Number} obj.y=0
   * @param {String} obj.style='default'
   * @param {Object} ..obj.styleArgs={}
   *
   * @name Canvas.fixdot
   * @function
   **/
  fixdot({x = 0, y = 0, style = 'default', ... styleArgs} = {}) {
    this._canvas.fixdot(
        x + this._xc,
        y + this._yc,
        style,
        this._element_style(styleArgs))
  }
  
  /**
   * Draws a gabor patch.
   *
   * @example
   * var myCanvas = Canvas()
   * myCanvas.gabor({x: 100, y: 100, orient: 45, freq: .05})
   *
   * @param {Object} obj
   * @param {Number} obj.x=0
   * @param {Number} obj.y=0
   * @param {Number} obj.orient=0
   * @param {Number} obj.freq=.1
   * @param {String} obj.env='gaussian'
   * @param {Number} obj.size=96
   * @param {Number} obj.stdev=12
   * @param {Number} obj.phase=0
   * @param {String} obj.col1='white'
   * @param {String} obj.col2='black'
   * @param {String} obj.bgmode='avg'
   * @param {Object} ..obj.styleArgs={}
   *
   * @name Canvas.gabor
   * @function
   **/
  gabor({x = 0, y = 0, orient = 0, freq = .1, env = 'gaussian', size = 96,
      stdev = 12, phase = 0, col1 = 'white', col2 = 'black',
      bgmode = 'avg'} = {}) {
    this._canvas.gabor(
        x + this._xc,
        y + this._yc,
        orient,
        freq,
        env,
        size,
        stdev,
        phase,
        col1,
        col2,
        bgmode)
  }
  
  /**
   * Draws an image from a file in the file pool.
   *
   * @example
   * var myCanvas = Canvas()
   * myCanvas.image({fname: 'image_in_pool.png'})
   *
   * @param {Object} obj
   * @param {String} obj.fname
   * @param {Boolean} obj.center=true
   * @param {Number} obj.x=0
   * @param {Number} obj.y=0
   * @param {Number} obj.scale=1
   * @param {Number} obj.rotation=0
   * @param {Object} ..obj.styleArgs={}
   *
   * @name Canvas.image
   * @function
   **/
  image({fname, center = true, x = 0, y = 0, scale = 1, rotation = 0} = {}) {
    if (typeof fname === "undefined") {
      throw "fname is a required parameter for Canvas.image()"
    }
    this._canvas.image(
        fname,
        center,
        x + this._xc,
        y + this._yc,
        scale,
        rotation)
  }
  
  /**
   * Draws a line.
   *
   * @example
   * var myCanvas = Canvas()
   * var ex = vars.width / 2
   * var ey = vars.height / 2
   * myCanvas.line({sx: 0, sy: 0, ex: ex, ey: ey})
   * 
   * @param {Object} obj
   * @param {Number} obj.sx=0
   * @param {Number} obj.sy=0
   * @param {Number} obj.ex=50
   * @param {Number} obj.ey=0
   * @param {Object} ..obj.styleArgs={}
   *
   * @name Canvas.line
   * @function
   **/
  line({sx = 0, sy = 0, ex = 50, ey = 0, ...styleArgs} = {}) {
    this._canvas.line(
        sx + this._xc,
        sy + this._yc,
        ex + this._xc,
        ey + this._yc,
        this._element_style(styleArgs))
  }
  
  /**
   * Draws a patch of noise, with an envelope.
   *
   * @example
   * var myCanvas = Canvas()
   * myCanvas.noise_patch({x: 100, y: 100, env: 'circular'})
   *
   * @param {Object} obj
   * @param {Number} obj.x=0
   * @param {Number} obj.y=0
   * @param {String} obj.env='gaussian'
   * @param {Number} obj.size=96
   * @param {Number} obj.stdev=12
   * @param {String} obj.col1='white'
   * @param {String} obj.col2='black'
   * @param {String} obj.bgmode='avg'
   * @param {Object} ..obj.styleArgs={}
   *
   * @name Canvas.noise_patch
   * @function
   **/
  noise_patch({x = 0, y = 0, env = 'gaussian', size = 96, stdev = 12,
      col1 = 'white', col2 = 'black', bgmode = 'avg'} = {}) {
    this._canvas.noise(
        x + this._xc,
        y + this._yc,
        env,
        size,
        stdev,
        col1,
        col2,
        bgmode)
  }
  
  /**
   * Draws a polygon that defined by a list of vertices. I.e. a shape of
   * points connected by lines.
   *
   * @example
   * var myCanvas = Canvas()
   * var n1 = [0,0]
   * var n2 = [100, 100]
   * var n3 = [0, 100]
   * myCanvas.polygon({vertices: [n1, n2, n3]})
   *
   * @param {Object} obj
   * @param {Array<Array<Number>>} obj.vertices
   * @param {Object} ..obj.styleArgs={}
   *
   * @name Canvas.polygon
   * @function
   **/
  polygon({vertices, ...styleArgs} = {}) {
    if (typeof vertices === "undefined") {
      throw "vertices is a required parameter for Canvas.polygon()"
    }
    // Adjust the coordinates of all vertices
    const v = []
    for (const [x, y] of vertices)
      v.push([x + this._xc, y + this._yc])
    this._canvas.polygon(v, this._element_style(styleArgs))
  }

  /**
   * Draws a rectangle.
   *
   * @example
   * var myCanvas = Canvas()
   * myCanvas.rect({x: -10, y: -10, w: 20, h: 20, fill:true})
   *
   * @param {Object} obj
   * @param {Number} obj.x=-50
   * @param {Number} obj.y=-25
   * @param {Number} obj.w=100
   * @param {Number} obj.h=50
   * @param {Object} ..obj.styleArgs={}
   *
   * @name Canvas.rect
   * @function
   **/
  rect({x = -50, y = -25, w = 100, h = 50, ...styleArgs} = {}) {
    this._canvas.rect(
        x + this._xc,
        y + this._yc,
        w,
        h,
        this._element_style(styleArgs))
  }
  
  /**
   * Shows, or 'flips', the canvas on the screen.
   *
   * @return {Number} A timestamp of the time at which the canvas appeared on
   *     the screen.
   *
   * @name Canvas.show
   * @function
   **/ 
  show() {
    return this._canvas.show()
  }
  
  /**
   * Draws text.
   *
   * @example
   * var myCanvas = Canvas()
   * myCanvas.text({text: 'Some text'})
   *
   * @param {Object} obj
   * @param {String} obj.text
   * @param {Boolean} obj.center=true
   * @param {Number} obj.x=0
   * @param {Number} obj.y=0
   * @param {Object} ..obj.styleArgs={}
   *
   * @name Canvas.text
   * @function
   **/
  text({text, center = true, x = 0, y = 0, ...styleArgs} = {}) {
    if (typeof text === "undefined") {
      throw "text is a required parameter for Canvas.text()"
    }    
    let style = this._element_style(styleArgs)
    this._canvas.text(
        text,
        center,
        x + this._xc,
        y + this._yc,
        style.html,
        style)
  }
}
