import {range} from 'pythonic'

/**
 * Provides common functions based on the Python API.
 **/
export default class JavaScriptWorkspaceAPI {

  constructor(experiment) {
    this._experiment = experiment
  }

  /**
   * Resets all feedback variables to their initial state.
   *
   * @example
   * reset_feedback()
   **/
  reset_feedback() {
    this._experiment.reset_feedback()
  }

  /**
   * Sets the subject number and parity (even/ odd). This function is called
   * automatically when an experiment is started, so you only need to call it
   * yourself if you overwrite the subject number that was specified when the
   * experiment was launched.
   *
   * @param {Number} nr The subject number
   *
   * @example
   * set_subject_nr(1)
   * console.log('Subject nr = ' + subject_nr)
   * console.log('Subject parity = ' + subject_parity)
   **/
  set_subject_nr(nr) {
    this._experiment.set_subject(nr)
  }

  /**
   * Returns true with a certain probability. (For more advanced randomization,
   * use the `random-ext` package, which is available as `random`.)
   * 
   * @param {Number} [p=.5] The probability of returning true
   *
   * @example
   * if (sometimes()) {
   *   console.log('Sometimes you win')
   * } else {
   *   console.log('Sometimes you lose')
   * }
   **/
  sometimes(p=.5) {
    if (typeof p !== "number" || p < 0 || p > 1)
      throw "p should be a numeric value between 0 and 1"
    return Math.random() < p
  }

  /**
   * Converts polar coordinates (distance, angle) to Cartesian coordinates
   * (x, y).
   *
   * @param {Number} rho The radial coordinate, also distance or eccentricity.
   * @param {Number} phi The angular coordinate. This reflects a clockwise
   *     rotation in degrees (i.e. not radians), where 0 is straight right.
   * @param {Array<Number>} [pole=[0, 0]] The reference point.
   * @return {Array<Number>} An [x, y] array.
   *
   * @example
   * // ECMA 5.1
   * var xy1 = xy_from_polar(100, 45)
   * var xy2 = xy_from_polar(100, -45)
   * var c = Canvas()
   * c.line({sx: xy1[0], sy: xy1[1], ex: -xy1[0], ey: -xy1[1]})
   * c.line({sx: xy2[0], sy: xy2[1], ex: -xy2[0], ey: -xy2[1]})
   * c.show()
   * // ECMA 6
   * let [x1, y1] = xy_from_polar(100, 45)
   * let [x2, y2] = xy_from_polar(100, -45)
   * let c = Canvas()
   * c.line({sx: x1, sy: y1, ex: -x1, ey: -y1})
   * c.line({sx: x2, sy: y2, ex: -x2, ey: -y2})
   * c.show()
   **/
  xy_from_polar(rho, phi, pole=[0, 0]) {
    if (typeof rho !== "number")
      throw "rho should be numeric in xy_from_polar()"
    if (typeof phi !== "number")
      throw "phi should be numeric in xy_from_polar()"
    phi = this._radians(phi)
    const [ox, oy] = this._parse_pole(pole)
    const x = rho * Math.cos(phi) + ox
    const y = rho * Math.sin(phi) + oy
    return [x, y]
  }

  /**
   * Converts Cartesian coordinates (x, y) to polar coordinates (distance,
   * angle).
   *
   * @param {Number} x The X coordinate.
   * @param {Number} y The Y coordinate
   * @param {Array<Number>} [pole=[0, 0]] The reference point.
   * @return {Array<Number>} An [rho, phi] array. Here, `rho` is the radial
   *     coordinate, also distance or eccentricity. `phi` is the angular
   *     coordinate in degrees (i.e. not radians), and reflects a
   *     counterclockwise rotation, where 0 is straight right.
   *
   * @example
   * // ECMA 5.1 (browser + desktop)
   * var rho_phi = xy_to_polar(100, 100)
   * var rho = rho_phi[0]
   * var phi = rho_phi[1]
   * // ECMA 6 (browser only)
   * let [rho, phi] = xy_to_polar(100, 100)
   **/
  xy_to_polar(x, y, pole=[0, 0]) {
    if (typeof x !== "number")
      throw "x should be numeric in xy_to_polar()"
    if (typeof y !== "number")
      throw "y should be numeric in xy_to_polar()"
    const [ox, oy] = this._parse_pole(pole)
    const dx = x - ox
    const dy = y - oy
    const rho = Math.sqrt(dx ** 2 + dy ** 2)
    const phi = this._degrees(Math.atan2(dy, dx))
    return [rho, phi]
  }
  
  /**
   * Gives the distance between two points.
   *
   * @param {Number} x1 The x coordinate of the first point.
   * @param {Number} y1 The y coordinate of the first point.
   * @param {Number} x2 The x coordinate of the second point.
   * @param {Number} y2 The y coordinate of the second point.
   * @return {Number} The distance between the two points.
   **/
  xy_distance(x1, y1, x2, y2) {
    if (typeof x1 !== "number" || typeof y1 !== "number" || 
        typeof x2 !== "number" || typeof y2 !== "number")
      throw "Coordinates should be numeric in xy_distance()"
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
  }
  
  /**
   * Generates a list of points (x,y coordinates) in a circle. This can be
   * used to draw stimuli in a circular arrangement.
   *
   * @param {Number} n The number of x,y coordinates to generate.
   * @param {Number} rho The radial coordinate, also distance or eccentricity,
   *     of the first point.
   * @param {Number} [phi0=0] The angular coordinate for the first coordinate.
   *     This is a counterclockwise rotation in degrees (i.e. not radians),
   *     where 0 is straight right.
   * @param {Array<Number>} [pole=[0, 0]] The reference point.
   * @return {Array<Array<Number>>} An array of [x,y] coordinate arrays.
   *
   * @example
   * // Draw 8 rectangles around a central fixation dot
   * // ECMA 5.1 (browser + desktop)
   * var c = Canvas()
   * c.fixdot()
   * var points = xy_circle(8, 100)
   * for (var i in points) {
   *   var x = points[i][0]
   *   var y = points[i][1]
   *   c.rect({x: x - 10, y: y - 10, w: 20, h: 20})
   * }
   * c.show()
   * // ECMA 6 (browser only)
   * let c = Canvas()
   * c.fixdot()
   * for (let [x, y] of xy_circle(8, 100)) {
   *   c.rect({x: x - 10, y: y - 10, w: 20, h: 20})
   * }
   * c.show()
   **/
  xy_circle(n, rho, phi0=0, pole=[0, 0]) {
    if (typeof n !== "number" || n < 0)
      throw "n should be a non-negative integer in xy_circle()"
    if (typeof rho !== "number" || typeof phi0 !== "number")
      throw "rho and phi0 should be numeric in xy_circle()"
    const a = []
    for (const i of range(n)) {
      a.push(this.xy_from_polar(rho, phi0, pole))
      phi0 += 360 / n
    }
    return a
  }
  
  /**
   * Generates a list of points (x,y coordinates) in a grid. This can be used
   * to draw stimuli in a grid arrangement.
   *
   * @param {Number|Array<Number>} n A number that indicates the number of
   *     columns and rows, so that `n=2` indicates a 2x2 grid, or a [n_col,
   *     n_row] array, so that `n=[2,3]` indicates a 2x3 grid.
   * @param {Number|Array<Number>} spacing A numeric value that indicates the
   *     spacing between cells, or a [col_spacing, row_spacing] array.
   * @param {Array<Number>} [pole=[0, 0]] The reference point.
   * @return {Array<Array<Number>>} An array of [x,y] coordinate arrays.
   *
   * @example
   * // Draw a 4x4 grid of rectangles
   * // ECMA 5 (desktop + browser)
   * var c = Canvas()
   * c.fixdot()
   * var points = xy_grid(4, 100)
   * for (var i in points) {
   *   var x = points[i][0]
   *   var y = points[i][1]
   *   c.rect({x: x - 10, y: y - 10, w: 20, h: 20})
   * }
   * c.show()
   * // ECMA 6 (browser only)
   * let c = Canvas()
   * c.fixdot()
   * for (let [x, y] of xy_grid(4, 100)) {
   *   c.rect({x: x-10, y: y-10, w: 20, h: 20})
   * }
   * c.show()
   **/
  xy_grid(n, spacing, pole=[0, 0]) {
    // Parse and validate the n
    const n_err_msg = "n should be a single non-negative number, or an array of two non-negative numbers in xy_grid()"
    let n_col
    let n_row
    if (typeof n === "object") {
      if (n.length !== 2)
        throw n_err_msg
      [n_col, n_row] = n
    } else {
      n_col = n
      n_row = n
    }
    if (typeof n_col !== "number" || typeof n_row !== "number")
      throw n_err_msg
    // Parse and validate the spacing
    const spacing_err_msg = "spacing should be a single non-negative number, or an array of two non-negative numbers xy_grid()"
    let s_col
    let s_row
    if (typeof spacing === "object") {
      if (spacing.length !== 2)
        throw spacing_err_msg
      [s_col, s_row] = spacing
    } else {
      s_col = spacing
      s_row = spacing
    }
    if (typeof s_col !== "number" || typeof s_row !== "number")
      throw spacing_err_msg
    // Generate the grid
    const [ox, oy] = this._parse_pole(pole)
    const a = []
    let x
    let y
    for (const row of range(n_row)) {
      y = (row - (n_row - 1) / 2) * s_row + oy
      for (const col of range(n_col)) {
        x = (col - (n_col - 1) / 2) * s_col + ox
        a.push([x, y])
      }
    }
    return a
  }
  
  /**
   * Generates a list of random points (x,y coordinates) with a minimum
   * spacing between each pair of points. This function will throw an error
   * when the coordinate list cannot be generated, typically because there are
   * too many points, the min_dist is set too high, or the width or height are
   * set too low.
   *
   * @param {Number} n The number of points to generate.
   * @param {Number} width The width of the field with random points.
   * @param {Number} height The height of the field with random points.
   * @param {Number} [min_dist=0] The minimum distance between each point.
   * @param {Array<Number>} [pole=[0, 0]] The reference point.
   * @return {Array<Array<Number>>} An array of [x,y] coordinate arrays.
   *
   * @example
   * // Draw a 50 rectangles in a random grid
   * // ECMA 5 (desktop + browser)
   * var c = Canvas()
   * c.fixdot()
   * var points = xy_random(50, 500, 500, 40)
   * for (var i in points) {
   *   var x = points[i][0]
   *   var y = points[i][1]
   *   c.rect({x: x - 10, y: y - 10, w: 20, h: 20})
   * }
   * c.show()   
   * // ECMA 6 (browser only)
   * let c = Canvas()
   * c.fixdot()
   * for (let [x, y] of xy_random(50, 500, 500, 40)) {
   *   c.rect({x: x-10, y: y-10, w: 20, h: 20})
   * }
   * c.show()
   **/
  xy_random(n, width, height, min_dist=0, pole=[0, 0]) {
    if (typeof n !== "number" || n < 0)
      throw "n should be a non-negative number in xy_circle()"
    if (typeof min_dist !== "number" || n < 0)
      throw "min_dist should be a non-negative number in xy_circle()"
    if (typeof width !== "number" || typeof height !== "number")
      throw "width and height should be numeric in xy_circle()"
    const [ox, oy] = this._parse_pole(pole)
    const max_try = 1000
    let a, i, t2, x1, y1, x2, y2, too_close
    for (const t1 of range(max_try)) {
      a = []
      for (i of range(n)) {
        // A loop for trying to find a single new point
        for (t2 of range(max_try)) {
          // Generate a point and check if it's not too close to the other
          // points so far
          x1 = (Math.random() - .5) * width + ox
          y1 = (Math.random() - .5) * height + oy
          too_close = false
          for ([x2, y2] of a) {
            if (this.xy_distance(x1, y1, x2, y2) < min_dist) {
              too_close = true
              break
            }
          }
          // Add the point and the break the loop for finding a single point
          if (!too_close) {
            a.push([x1, y1])
            break
          }
        }
      }
      // If the array is complete, return it. If not, the outer for loop will
      // try again until max_try is reached
      if (a.length === n)
        return a
    }
    throw "Failed to generate random coordinates in xy_random()"
  }
  
  _radians(a) {
    return (a / 360) * 2 * Math.PI
  }
  
  _degrees(a) {
    return (a / (2 * Math.PI)) * 360
  }
  
  _parse_pole(pole) {
    if (pole.length !== 2)
      throw "pole should be an array of two numeric values"
    const [x, y] = pole
    if (typeof x !== "number" || typeof y !== "number")
      throw "pole should be an array of two numeric values"
    return [x, y]
  }
}
