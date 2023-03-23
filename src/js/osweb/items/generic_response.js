import Item from './item.js'
import Keyboard from '../backends/keyboard.js'
import Mouse from '../backends/mouse.js'
import {
  constants
} from '../system/constants.js'

/**
 * Class representing a GeneralResponse item.
 * @extends Item
 */
export default class GenericResponse extends Item {
  /** The sequence class controls the running of a serie of items. */
  constructor (experiment, name, script) {
    // Inherited.
    super(experiment, name, script)

    // Create and set private properties.
    this._allowed_responses = null
    this._duration = 0
    this._duration_func = null
    this._keyboard = null
    this._mouse = null
    this._responsetype = constants.RESPONSE_NONE
    this._timeout = -1

    // Create and set public properties.
    this.process_feedback = false
    this.synonyms = null
  }

  /** Implements the complete phase of the general response item. */
  _complete () {
    // Check if a timeout has occured which must be treaded as a response.
    let timeout = this.vars.get('timeout')
    if ((typeof timeout !== 'undefined') &&
      ((this.experiment._runner._events._timeStamp - this.experiment.vars.get('time_' + this.name)) > timeout)) {
      // Process the timeout none response.
      this.process_response_timeout()
    }

    // Inherited.
    super._complete()
  }

  /**
     * Implements the update response phase of the general response item.
     * @param {Object} response - The response object which is evaluated.
     */
  _update (response) {
    if (response !== null) {
      // Implements the update response phase of the item.
      if ((this._responsetype === constants.RESPONSE_KEYBOARD) &&
        (response.type === constants.RESPONSE_KEYBOARD)) {
        this.process_response_keypress(response)
      } else if ((this._responsetype === constants.RESPONSE_MOUSE) &&
        (response.type === constants.RESPONSE_MOUSE)) {
        this.process_response_mouseclick(response)
      }
    }
  }
  
  /**
   * Converts a string of semi-colon separated responses to an array of
   * responses.
   **/
  _prepare_responses (responses) {
    if (responses === null)
      return null
    let response_array = String(responses).split(';')
      .map(item => (typeof item === 'string')
        ? item.replace(/^"(.*)"$/g, '$1').trim()
        : item).filter(Boolean)
    if (response_array.length === 0)
      return null
    const duration = this.vars.get('duration')
    if (duration === 'keypress') {
        response_array = this._keyboard._get_default_from_synonym(response_array)
      } else if (duration === 'mouseclick') {
        response_array = this._mouse._get_default_from_synonym(response_array)
      }
    return response_array
  }

  /** Prepare the list with allowed responses */
  prepare_allowed_responses () {
    this._allowed_responses = this._prepare_responses(this.vars.get('allowed_responses'))
    if ((this._allowed_responses !== null) && (this._allowed_responses.length === 0)) {
      this.experiment._runner._debugger.addError(
        'Defined responses are not valid in keyboard_response: ' +
        this.name + ' (' + this.vars.get('allowed_responses') + ')')
    }
  }
  
  /** Prepare the list with correct responses */
  prepare_correct_responses () {
    this._correct_responses = this._prepare_responses(this.vars.get('correct_response'))
    if ((this._correct_responses !== null) && (this._correct_responses.length === 0)) {
      this.experiment._runner._debugger.addError(
        'Correct response is not valid in keyboard_response: ' +
        this.name + ' (' + this.vars.get('correct_response') + ')')
    }
  }

  // Prepare the duration of the stimulus interaction. */
  prepare_duration () {
    this._duration = this.syntax.remove_quotes(this.vars.get('duration'))
    if (this._duration === null)
      return
    if ((this._duration === 'keypress') || (this._duration === 'mouseclick') ||
        (this._duration === 'sound') || (this._duration === 'video')) {
      this._duration = -1
      const duration = this.vars.get('duration')
      if (duration === 'keypress') {
        this.prepare_duration_keypress()
        this._responsetype = constants.RESPONSE_KEYBOARD
      } else if (duration === 'mouseclick') {
        this.prepare_duration_mouseclick()
        this._responsetype = constants.RESPONSE_MOUSE
      } else if (duration === 'sound') {
        this._responsetype = constants.RESPONSE_SOUND
      } else if (duration === 'video') {
        this._responsetype = constants.RESPONSE_VIDEO
      }
      return
    }
    // Prepare a duration in milliseconds
    this._duration = Number(this._duration)
    if (this._duration === 0) {
      this._responsetype = constants.RESPONSE_NONE
    } else {
      this._responsetype = constants.RESPONSE_DURATION
    }
  }

  /** Prepare the system for a keyboard duration interval. */
  prepare_duration_keypress () {
    // Prepare a keyboard duration.
    this._keyboard = new Keyboard(this.experiment)
    this._final_duration = (this._timeout !== -1) ? this._timeout : this._duration
  }

  /** Prepare the system for a mouseclick duration interval. */
  prepare_duration_mouseclick () {
    // Prepare a mouseclick duration.
    this._mouse = new Mouse(this.experiment)
    this._final_duration = (this._timeout !== -1) ? this._timeout : this._duration
  }

  /** Prepare the system for a timeout. */
  prepare_timeout () {
    let timeout = this.vars.get('timeout')
    if (timeout === null) return
    this._timeout = (typeof timeout === 'number') ? timeout : -1
  }
  
  /** Sets duration and allowed responses on the response object. **/
  configure_response_objects() {
    const duration = this.vars.get('duration')
    if (duration === 'keypress') {
      this._keyboard._set_config(this._final_duration, this._allowed_responses)
    } else if (duration === 'mouseclick') {
      this._mouse._set_config(this._final_duration, this._allowed_responses, false)
    }
  }

  /** Select the type of stimulus response processing. */
  process_response () {
    // Start stimulus response cycle.
    switch (this._responsetype) {
    case constants.RESPONSE_NONE:
      // Duration is 0, so complete the stimulus/response cycle.
      this._status = constants.STATUS_FINALIZE
      this._complete()
      break
    case constants.RESPONSE_DURATION:
      this.sleep_for_duration()
      break
    case constants.RESPONSE_KEYBOARD:
      this._keyboard.get_key()
      break
    case constants.RESPONSE_MOUSE:
      this._mouse.get_click()
      break
    case constants.RESPONSE_SOUND:
      this._sampler.wait()
      break
    case constants.RESPONSE_VIDEO:
      this._video_player.wait()
      break
    }
  }

  /** Sets the mouse coordinates based **/
  set_mouse_coordinates (clientX, clientY) {
    // We need the top-left and scaling of the viewport to set the mouse
    // coordinates so that 0,0 corresponds to the display center. The scaling
    // needs to be taken into account also such that the viewport always has
    // the same size in cursor coordinates, even if it's scaled down.
    const rect = this._runner._renderer.view.getBoundingClientRect()
    const width = this.experiment.vars.get('width')
    const height = this.experiment.vars.get('height')
    const scale = Math.min(
      (rect.right - rect.left) / width,
      (rect.bottom - rect.top) / height
    )
    const center_x = scale * width / 2
    const center_y = scale * height / 2
    this.experiment.vars.set('cursor_x', (clientX - center_x - rect.left) / scale)
    this.experiment.vars.set('cursor_y', (clientY - center_y - rect.top) / scale)
  }

  /** Process a keyboard response. */
  process_response_keypress (retval) {
    this.experiment._start_response_interval = this.sri
    this.experiment._end_response_interval = retval.rtTime
    const response = this.syntax.sanitize(retval.resp)
    this.experiment.vars.set('response', response)
    this.synonyms = this._keyboard._synonyms(response)
    this.response_bookkeeping()
  }

  /** Process a mouse click response. */
  process_response_mouseclick (retval) {
    this.experiment._start_response_interval = this.sri
    this.experiment._end_response_interval = retval.rtTime
    this.experiment.vars.response = retval.resp
    this.synonyms = this._mouse._synonyms(this.experiment.vars.response)
    this.set_mouse_coordinates(retval.event.clientX, retval.event.clientY)
    this.response_bookkeeping()
  }

  /** Process a time out response. */
  process_response_timeout () {
    this.experiment._start_response_interval = this.sri
    this.experiment._end_response_interval = this.experiment._runner._events._timeStamp
    this.experiment.vars.set('response', 'None')
    this.synonyms = ['None', 'none']
    this.response_bookkeeping()
  }

  /** General response logging after a stimulus/response. */
  response_bookkeeping () {
    // The respone and response_time variables are always set, for every response item
    this.experiment.vars.set('response_time', this.experiment._end_response_interval - this.experiment._start_response_interval)
    this.experiment.vars.set('response_' + this.name, this.experiment.vars.get('response'))
    this.experiment.vars.set('response_time_' + this.name, this.experiment.vars.get('response_time'))
    this.experiment._start_response_interval = null
    // But correctness information is only set for dedicated response items,
    // such as keyboard_response items, because otherwise we might confound the
    // feedback
    if (this.process_feedback !== true)
      return
    if (this._correct_responses === null) {
      this.experiment.vars.set('correct', 'undefined')
      return
    }
    this.experiment.vars.set('correct', 0)
    for (let cr of this._correct_responses) {
      if (this.synonyms.includes(cr)) {
        this.experiment.vars.set('correct', 1)
        this.experiment.vars.set('total_correct', this.experiment.vars.total_correct + 1)
        break
      }
    }
    this.experiment.vars.set('total_response_time',
      this.experiment.vars.get('total_response_time') + this.experiment.vars.get('response_time'))
    this.experiment.vars.set('total_response',
      this.experiment.vars.get('total_responses') + 1)
    this.experiment.vars.set('accuracy', 
      Math.round(100.0 * this.experiment.vars.get('total_correct') / this.experiment.vars.get('total_responses')))
    this.experiment.vars.set('acc', this.experiment.vars.accuracy)
    this.experiment.vars.set('average_response_time',
      Math.round(this.experiment.vars.get('total_response_time') / this.experiment.vars.get('total_responses')))
    this.experiment.vars.set('avg_rt', this.experiment.vars.get('average_response_time'))
    this.experiment.vars.set('correct_' + this.name, this.experiment.vars.correct)
  }

  /**
     * Sets or resets the start of the stimulus response interval.
     * @param {Boolean} reset - If true reset the sri value.
     */
  set_sri (reset) {
    // Sets the start of the response interval.
    if (reset === true) {
      this.sri = self.vars.get('time_' + this.name)
      this.experiment._start_response_interval = this.vars.get('time_' + this.name)
    }
    if (!this.experiment._start_response_interval) {
      this.sri = this.experiment.vars.get('time_' + this.name)
    } else {
      this.sri = this.experiment._start_response_interval
    }
  }

  /** Sleep for a specified time. */
  sleep_for_duration () {
    // Sleep for a specified time.
    this.sleep(this._duration)
  }

  /** Implements the prepare phase of the general response item. */
  prepare () {
    // Implements the prepare phase of the item.
    this.prepare_timeout()
    this.prepare_duration()
    this.prepare_allowed_responses()
    this.prepare_correct_responses()
    this.configure_response_objects()
    // Inherited.
    super.prepare()
  }
}
