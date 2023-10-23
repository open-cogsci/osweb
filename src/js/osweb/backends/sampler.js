import {
  constants
} from '../system/constants.js'
import { getAudioContext } from '../system/audio_context'

/** Class representing a sampler. */
export default class SamplerBackend {
  /**
   * Create a sampler object which controls the sampler device.
   * @param {Object} experiment - The experiment to which the sampler belongs.
   * @param {Object} source - A file pool object.
   * @param {Number} volume - The volume to use when playing the sound.
   * @param {Number} pitch - The pitch to use when playing the sound.
   * @param {Number} pan - The pan to use when playing the sound.
   * @param {String} duration - The duration of the sound.
   * @param {Number} fade - The fade to use when playing the sound.
   * @param {Boolean} block - If true use the sound ad a block wave.
   */
  constructor (experiment, source, volume, pitch, pan, duration, fade, block) {
    this.block = (typeof block === 'undefined') ? false : block
    this.duration = (typeof duration === 'undefined') ? 'sound' : duration
    this.experiment = experiment
    this.volume = (typeof volume === 'undefined') ? 1 : volume
    this.fade = (typeof fade === 'undefined') ? 0 : fade
    this.pan = (typeof pan === 'undefined') ? 0 : pan
    this.pitch = (typeof pitch === 'undefined') ? 1 : pitch
    try {
      this.audioBuffer = source.data
    } catch (e) {
      console.error('Could not play sound:', source)
      throw e
    }
    this.audioContext = getAudioContext()
    this.source = this.audioContext.createBufferSource()
    this.source.buffer = this.audioBuffer
    this.source.onended = () => this.experiment._runner._events._audioEnded(this)
    // this.sample.onended = () => this.experiment._runner._events._audioEnded(this)
    // // We can only connect a sample to an audio context once
    // if (typeof source.mediaElementSource === 'undefined')
    //   source.mediaElementSource = this.audioContext.createMediaElementSource(this.sample)
    // this.source = source.mediaElementSource
  }
  
  /**
   * Play a sound file.
   * @param {Number} volume - The volume to use when playing the sound.
   * @param {Number} pitch - The pitch to use when playing the sound.
   * @param {Number} pan - The pan to use when playing the sound.
   * @param {String} duration - The duration of the sound.
   * @param {Number} fade - The fade to use when playing the sound.
   * @param {Boolean} block - If true use the sound ad a block wave.
   */
  play (volume, pitch, pan, duration, fade, block) {
    // Check if optional parameters are defined.
    this.block = block || this.block
    this.duration = typeof duration === 'undefined' ? this.duration : duration
    this.volume = typeof volume === 'undefined' ? this.volume : volume
    this.pitch = typeof pitch === 'undefined' ? this.pitch : pitch
    this.pan = typeof pan === 'undefined' ? this.pan : pan
    this.fade = typeof fade === 'undefined' ? this.fade : fade

    this.source.connect(this.applyFilters())
    this.source.start(0)
    // if (this.audioContext) {
    //   if (this.audioContext.state === 'suspended') this.audioContext.resume()
    //   this.source.connect(this.applyFilters())
    // } else {
    //   this.source.volume = this.volume
    // }
    // this.sample.preservesPitch = false
    // this.sample.playbackRate = this.pitch
    // this.sample.play()
  }

  /** Set the blocking of the sound (wait period). */
  wait () {
    // Set the blocking of the sound.
    this.experiment._runner._events._run(this, -1, constants.RESPONSE_SOUND, [])
  }
  
  clearFilters () {
    // Disconnect audio nodes so that they don't accumulate
    this.nodes.forEach(node => node.disconnect())
  }

  applyFilters () {
    this.nodes = [this.audioContext.destination]
    // Set volume
    const gainNode = new GainNode(this.audioContext)
    gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime)
    if (this.fade) {
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + this.fade / 1000)
    }
    this.nodes.unshift(gainNode)
    // Set panning
    if (this.pan) {
      let pan
      if (this.pan === 'left')
        pan = -1
      else if (this.pan === 'right')
        pan = 1
      else
        pan = this.pan
      try {
        this.nodes.unshift(new StereoPannerNode(this.audioContext, { pan: pan }))
      } catch (e) {
        console.warn('Unable to apply panning', e)
      }
    }
    // Connect the filters creating a chain
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i] !== this.audioContext.destination) {
        this.nodes[i].connect(this.nodes[i + 1])
      }
    }
    return this.nodes[0]
  }
}
