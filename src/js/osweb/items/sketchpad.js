import GenericResponse from './generic_response.js'
import Canvas from '../backends/canvas.js'

/**
 * Class representing a Sketchpad item.
 * @extends GeneralResponse
 */
export default class Sketchpad extends GenericResponse {
  constructor (experiment, name, script) {
    super(experiment, name, script)
    this.canvas = new Canvas(experiment, false)
    this.elements = []
    this.from_string(script)
  }

  /**
    * Sort function used for determining the draw index (z-index) of alle elemente.
    * @param {Object} a - The first object to compare.
    * @param {Object} b - The second object to compare.
    * @return {Number} - The result of the comparison.
    */
  _compare (a, b) {
    // Sort function used for determining the draw index (z-index) of alle elemente.
    if (a.z_index() < b.z_index()) { return 1 } else if (a.z_index() > b.z_index()) { return -1 } else { return 0 }
  }

  /** Resets all item variables to their default value. */
  reset () {
    this.elements = []
    this.vars.set('duration', 'keypress')
    this.vars.set('linked_sketchpad', '')
  }

  /** Process a time out response. */
  process_response_timeout () {
    // Nothing happens
  }

  /**
    * Parse a definition string and retrieve all properties of the item.
    * @param {String} script - The script containing the properties of the item.
    */
  from_string (script) {
    this.variables = {}
    this.comments = []
    this.reset()
    if (script === null)
      return
    const lines = script.split('\n')
    for (let line of lines) {
      if ((line === '') || (this.parse_variable(line) !== false))
        continue
      const tokens = this.syntax.split(line)
      if ((tokens.length > 0) && (tokens[0] === 'draw')) {
        if (this.experiment.items._isClass(tokens[1]) === true) {
          var element = this.experiment.items._newElementClass(tokens[1], this, line)
          this.elements.push(element)
        } else {
          this.experiment._runner._debugger.addError('Failed to parse definition: ' + tokens[1])
        }
      }
    }
    // Sort the elements usin the z-index.
    this.elements.sort(this._compare)
  }

  /**
   * Set the background color of the canvas if it is defined in the var store
   *
   * @memberof Sketchpad
   */
  _set_bg_color () {
    const backgroundColor = this.vars.get('background')
    if (backgroundColor) {
      this.canvas._styles.background_color = backgroundColor
    }
  }
  
  /** Allow derived classes to call the super.prepare() instead of the custom
    * prepare below.
    */
  super_prepare() {
    super.prepare()
  }

  /** Implements the prepare phase of an item. */
  prepare () {
    this.canvas.clear()
    // The draw functions may return a promise or undefined. We collect all
    // promises that are returned, and wait for all them to resolve before we
    // call the super.prepare function. This allows for draw operations that
    // take some time, for example the textline draw function that may need to
    // load a webfont.
    const promises = this.elements
      .filter(element => element.is_shown() === true)
      .map(element => { return element.draw() })
      .filter(promise => promise !== undefined)
    Promise.all(promises).then(() => {
      super.prepare()
    })
  }
  /** Implements the run phase of the Sketschpad. */
  run () {
    super.run()
    this._set_bg_color()
    // Set the onset and start the stimulus response process.
    this.set_item_onset(this.canvas.show())
    this.set_sri(false)
    this.process_response()
  }

  * coroutine () {
    yield
    this._set_bg_color()
    this.set_item_onset(this.canvas.show())
  }
}
