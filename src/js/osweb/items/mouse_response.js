import GenericResponse from './generic_response.js'
import Mouse from '../backends/mouse.js'

/**
 * Class representing a mouse response item.
 * @extends GenericResponse
 */
export default class MouseResponse extends GenericResponse {
  /**
     * Create an mouse response item which waits for a mouse response.
     * @param {Object} experiment - The experiment item to which the item belongs.
     * @param {String} name - The unique name of the item.
     * @param {String} script - The script containing the properties of the item.
     */
  constructor (experiment, name, script) {
    super(experiment, name, script)
    this.description = 'Collects mouse responses'
    this.resp_codes = {}
    this._flush = 'yes'
    this.from_string(script)
  }

  /** Implements the complete phase of the Sketschpad. */
  _complete () {
    // Hide the mouse cursor.
    this._mouse.show_cursor(false)

    // Inherited.
    super._complete()
  }

  /** Resets all item variables to their default value. */
  reset () {
    this.process_feedback = true
    this.resp_codes = {}
    this.resp_codes['0'] = 'timeout'
    this.resp_codes['1'] = 'left_button'
    this.resp_codes['2'] = 'middle_button'
    this.resp_codes['3'] = 'right_button'
    this.resp_codes['4'] = 'scroll_up'
    this.resp_codes['5'] = 'scroll_down'
    this.vars.set("allowed_responses", null)
    this.vars.set("correct_response", null)
    this.vars.set('duration', 'mouseclick')
    this.vars.set('flush', 'yes')
    this.vars.set('show_cursor', 'yes')
    this.vars.set('timeout', 'infinite')
    this.vars.set('linked_sketchpad', '')
  }

  prepare () {
    super.prepare()
  }

  run () {
    super.run()
    this.set_item_onset()
    if (this.vars.get('show_cursor') === 'yes') {
      this._mouse.show_cursor(true)
    }

    // Flush responses, to make sure that earlier responses are not carried over.
    if (this.vars.get("flush") === 'yes') {
      this._mouse.flush()
    }

    this.set_sri()
    this.process_response()
  }

  * coroutine () {
    const mouseDownHandler = (event) => {
      this.response = this.experiment._runner._events._processMouseEvent(event, 1)
    }

    const touchHandler = (event) => {
      event.button = 0
      event.clientX = event.changedTouches[0].clientX
      event.clientY = event.changedTouches[0].clientY
      this.response = this.experiment._runner._events._processMouseEvent(event, 1)
    }

    window.addEventListener('mousedown', mouseDownHandler)
    window.addEventListener('touchstart', touchHandler)

    yield
    // Show the cursor if defined.
    if (this.vars.get('show_cursor') === 'yes') {
      this._mouse.show_cursor(true)
    }

    // Record the onset of the current item.
    this.set_item_onset()

    this.set_sri()
    let proceed = true
    this.response = null
    while (!this.response && proceed) {
      proceed = yield true
    }
    window.removeEventListener('mousedown', mouseDownHandler)
    window.removeEventListener('touchstart', touchHandler)
    if (this.response) this.process_response_mouseclick(this.response)
  }
}
