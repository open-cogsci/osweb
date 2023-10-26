import GenericResponse from './generic_response.js'
import SamplerBackend from '../backends/sampler.js'

/**
 * Class representing a sampler item.
 * @extends GenericResponse
 */
export default class Sampler extends GenericResponse {
  /**
     * Create a sampler  item which plays a sound.
     * @param {Object} experiment - The experiment item to which the item belongs.
     * @param {String} name - The unique name of the item.
     * @param {String} script - The script containing the properties of the item.
     */
  constructor (experiment, name, script) {
    // Inherited create.
    super(experiment, name, script)

    // Definition of public properties.
    this.block = false
    this.description = 'Plays a sound file in .wav or .ogg format'

    // Definition of private properties.
    this._sample = null
    this._sampler = null

    // Process the script.
    this.from_string(script)
  }

  /** Reset all item variables to their default value. */
  reset () {
    this.block = false
    this.vars.set('sample', '')
    this.vars.set('pan', 0)
    this.vars.set('pitch', 1)
    this.vars.set('fade_in', 0)
    this.vars.set('stop_after', 0)
    this.vars.set('volume', 1)
    this.vars.set('duration', 'sound')
    this.vars.set('linked_sketchpad', '')
  }

  /** Implements the prepare phase of an item. */
  prepare () {
    const sample = this.vars.get('sample')
    if (sample === '') 
      throw `No sample has been specified in sampler: ${sample}`
    this._sample = this._runner._pool[sample]
    if (typeof (this._sample) === 'undefined')
      this.experiment._runner._debugger.addError(`"${sample}" does not exist in the file pool`)
    this._sampler = new SamplerBackend(this.experiment, this._sample,
      this.vars.get("volume"), this.vars.get("pitch"), this.vars.get("pan"),
      this.vars.get("duration"), this.vars.get("fade_in"))
    super.prepare()
  }

  /** Implements the run phase of an item. */
  run () {
    this.set_item_onset()
    this.set_sri()
    this._sampler.play()
    this.process_response()
  }
}
