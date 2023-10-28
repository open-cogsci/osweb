import { isFunction } from 'lodash'
import { Container, Sprite, Graphics, Text } from 'pixi.js'
import { VERSION_NUMBER } from '../index.js'
import { getAudioContext } from './audio_context'

/** Class representing a Screen. */
export default class Screen {
  /**
   * Create an introduction screen which handles the start of the experiment.
   * @param {Object} runner - The runner class to which the screen belongs.
   */
  constructor (runner) {
    // Set class parameter properties.
    this._runner = runner // Parent runner attached to the screen object.

    // Set class properties.
    this._active = true // If true the introduction screen is shown.
    this._click = true // If true all is started with a mouse click.
    this._container = null //  Container which holds the screen info.
    this._exit = false // Exit toggle to prevent dialog when closing experiment.
  }

  screenCenter () {
    return {
      x: this._runner._renderer.width / 2,
      y: this._runner._renderer.height / 2
    }
  }

  /** Initialize the fullscreen mode if enabled. */
  _fullScreenInit () {
    if (this._runner._fullScreen === true) {
      // At the moment, Safari appears not implement the fullscreen API and
      // still needs the webkit prefix
      if (typeof document.documentElement.requestFullscreen === 'undefined') {
        console.log('using webkit fullscreen functions')
        document.documentElement.requestFullscreen = document.documentElement.webkitRequestFullscreen
        document.exitFullscreen = document.webkitExitFullscreen
      }
      document.documentElement.requestFullscreen()
    }
  }

  /** Finalize the fullscreen mode if if was enabled. */
  _fullScreenExit () {
    if (document.fullscreenElement !== null && this._runner._fullScreen === true) {
      document.exitFullscreen()
    }
  }

  /** Set the introscreen elements. */
  _setupIntroScreen ( logoSrc ) {
    // Check if introscreen is used.
    if (this._active === true) {
      // Define introscreen elements.
      this._introScreen = new Container()

      const center = this.screenCenter()

      const logoPath = (typeof logoSrc === 'undefined') ? 'img/opensesame.png' : logoSrc

      const oswebLogo = Sprite.from(logoPath)
      const oswebTitle = new Text('OSWeb', {
        fontFamily: 'Arial',
        fontSize: 48,
        fill: '#607d8b'
      })
      const versionInfo = new Text(VERSION_NUMBER, {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#607d8b'
      })

      const copyrightText = new Text(
        `Copyright Jaap Bos, Daniel Schreij & Sebastiaan Mathot, 2016 - ${(new Date()).getFullYear()}`,
        {
          fontFamily: 'Arial',
          fontSize: 16,
          fill: '#607d8b'
        }
      )

      oswebLogo.width = oswebLogo.height = 150

      oswebLogo.position.set(center.x - oswebLogo.width / 2, 50)
      oswebTitle.position.set(center.x - oswebTitle.width / 2, 215)
      versionInfo.position.set(center.x - versionInfo.width / 2, 270)
      copyrightText.position.set(
        center.x - copyrightText.width / 2,
        center.y * 2 - copyrightText.height * 2
      )

      this._statusText = new Text('', {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#607d8b'
      })
      this._statusText.position.set(
        center.x - this._statusText.width / 2,
        center.y
      )
      this._introScreen.addChild(oswebLogo, oswebTitle,
        versionInfo, copyrightText, this._statusText)

      // Show the introduction screen.
      this._runner._renderer.render(this._introScreen)
    }
  }

  /** Check if the experiment must be clicked to start. */
  _setupClickScreen (text) {
    // If no user interaction is required to start the experiment, we continue
    // straight away
    if (this._click === false) {
      this._clearIntroScreen()
      this._runner._initialize()
      return
    }
    // Otherwise we require the user to touch/ click the screen, in response
    // to which all audio files are preloaded before the experiment actually
    // launches. This implemented in a series of callbacks below.
    //
    // Once all audio samples have been preloaded, we continue with the
    // experiment.
    let preloadStimuli = function(event) {
      let continueAfterPreload = function() {
        if (this._audioContext === null) {
          console.log('already finished silent playback, ignoring')
          return
        }
        this._audioContext = null
        console.log('finished silent playback')
        this._runner._renderer.view.removeEventListener('click', preloadStimuli)
        this._runner._renderer.view.removeEventListener('touchstart', preloadStimuli)
        this._clearIntroScreen()
        this._runner._initialize()
      }.bind(this)
      // Once the audio context is running, this function silently and 
      // briefly plays all audio samples so that they can be played back
      // without a user interaction later on.
      let withRunningAudioContext = function() {
        if (this._preloadQueue.length > 0) {
          console.log(`silently playing ${this._preloadQueue.length} audio samples`)
          let promises = []
          while (this._preloadQueue.length > 0) {
            let item = this._preloadQueue.pop()
            if (item.type === 'audioBuffer') {
              console.log('silently playing audio buffer for preloading')
              const source = this._audioContext.createBufferSource()
              source.buffer = item.data
              // Create a Gain Node to mute the audio
              const gainNode = this._audioContext.createGain()
              gainNode.gain.setValueAtTime(0, this._audioContext.currentTime)
              source.connect(gainNode).connect(this._audioContext.destination)
              // Create a promise to be resolved when this buffer starts playing
              promises.push(new Promise((resolve) => {
                source.onended = resolve
              }));
              // Start and stop playing the audio buffer almost immediately
              source.start(0)
              source.stop(0 + 0.001)
            }
          } 
          // Wait for all audio to finish playing, then proceed
          Promise.all(promises)
            .then(continueAfterPreload)
            .catch((error) => {
              console.log('failed to preload some or all audio buffers: ' + error)
            })
        } else {
          continueAfterPreload()
        }
      }.bind(this)
      // We get the audio context and try to resume it if it is currently
      // suspended. Once the audio context is running, we continue. If 
      // resuming the context fails, we do nothing so that the user can
      // click the screen again to try again.
      this._audioContext = getAudioContext()
      if (this._audioContext.state === 'suspended') {
        this._audioContext.resume()
          .then(() => {
            console.log('audio context resumed')
            withRunningAudioContext()
          })
          .catch(() => {
            console.log('failed to resume audio context, click to try again')
          })
      } else {
        console.log('no need to resume audio context')
        withRunningAudioContext()
      }
    }.bind(this)
    // Update inroscreen.
    if ((typeof text === "undefined") || (text.length === 0)) {
      text = `
Never provide personal or sensitive information
    such as credit card numbers or PIN codes

           Click or touch the screen to begin!`
    }
    this._updateIntroScreen(text)
    this._preloadQueue = this._runner._experiment.pool._items.slice()
    this._runner._renderer.view.addEventListener('click', preloadStimuli)
    this._runner._renderer.view.addEventListener('touchstart', preloadStimuli)
  }

  /** Clear the introscreen elements. */
  _clearIntroScreen () {
    // Update the introscreen elements.
    if (this._active === true) {
      // Clear the stage by temoving al the child elements.
      for (var i = this._introScreen.children.length - 1; i >= 0; i--) {
        this._introScreen.removeChild(this._introScreen.children[i])
      }
      this._runner._renderer.render(this._introScreen)
    }
  }

  /**
   * Update the introscreen elements.
   * @param {String} text - The text which must be updated.
   */
  _updateIntroScreen (text) {
    // Update the introscreen elements.
    if (this._active === true) {
      const center = this.screenCenter()
      this._statusText.text = text.replace(/<br \/>/g, '\n').replace(/&#39;/g, "'").replace(/&#34;/g, '"')
      this._statusText.position.set(
        center.x - this._statusText.width / 2,
        center.y
      )
      this._runner._renderer.render(this._introScreen)
    }
  }

  /** Show the pause screen. */
  _showPauseScreen () {
    // Open Sesame is running, request subject to continue of to stop.
    if (isFunction(this._runner._confirm)) {
      this._runner._confirm('Esc key pressed, pausing experiment.',
        'Please press ok the resume the experiment otherwise cancel to stop.',
        this._onPauseScreenConfirm.bind(this), this._onPauseScreenCancel.bind(this))
    }
  }

  /** Event handler to respond to dialog ok conmfirmation. */
  _onPauseScreenConfirm () {
    // Restore the old state.
    this._runner._events._state = this._runner._events._statePrevious
  }

  /** Event handler to respond to dialog cancel confirmation. */
  _onPauseScreenCancel () {
    // Exit the experiment.
    this._runner._finalize()
  }
}
