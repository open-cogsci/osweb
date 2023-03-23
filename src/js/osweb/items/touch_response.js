import MouseResponse from '../items/mouse_response.js'

/**
 * Class representing a reset feedback item.
 * @extends Item
 */
export default class TouchResponse extends MouseResponse {
  /**
     * Create a reset feedback  item which resets the feedback values.
     * @param {Object} experiment - The experiment item to which the item belongs.
     * @param {String} name - The unique name of the item.
     * @param {String} script - The script containing the properties of the item.
     */
  constructor (experiment, name, script) {
    // Inherited.
    super(experiment, name, script)

    // Define and set the public properties.
    this.description = 'A grid-based response item, convenient for touch screens'
  }

  /** Resets all item variables to their default value. */
  reset () {
    super.reset()
    this.vars.set('allowed_responses', null)
    this.vars.set("_ncol", 2)
    this.vars.set("_nrow", 1)
  }

  /** Implements the prepare phase of an item. */
  prepare () {
    // Temp hack
    this.experiment.vars.set('correct' , -1)
    // Inherited.
    super.prepare()
  }

  /**
     * Process a mouse click response.
     * @param {Object} pRetval - The mouse response to process.
     */
  process_response_mouseclick (retval) {
    this.experiment._start_response_interval = this.sri
    this.experiment._end_response_interval = retval.rtTime
    this.set_mouse_coordinates(retval.event.clientX, retval.event.clientY)
    // Calulate the row, column and cell.
    const cursor_x = this.experiment.vars.get('cursor_x')
    const cursor_y = this.experiment.vars.get('cursor_y')
    const width = this.experiment.vars.get('width')
    const height = this.experiment.vars.get('height')
    const ncol = this.vars.get('_ncol')
    const nrow = this.vars.get('_nrow')
    this.col = Math.floor((cursor_x + width / 2) / (width / ncol))
    this.row = Math.floor((cursor_y + height / 2) / (height / nrow))
    this.cell = this.row * ncol + this.col + 1
    this.experiment.vars.set('response', this.cell)
    this.synonyms = [this.experiment.vars.get('response').toString()]
    this.response_bookkeeping()
  }
}
