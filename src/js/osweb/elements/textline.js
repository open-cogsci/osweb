import BaseElement from './base_element.js'
import Styles from '../backends/styles.js'
import WebFont from 'webfontloader'

/**
 * Class representing a textline element.
 * @extends BaseElement
 */
export default class Textline extends BaseElement {
  /**
     * Create an experiment item which controls the OpenSesame experiment.
     * @param {Object} sketchpad - The sketchpad item that owns the visual element.
     * @param {String} script - The script containing properties of the visual element.
     */
  constructor (sketchpad, script) {
    // Create a default property container.
    var defaults = {}
    defaults.center = 1
    defaults.color = sketchpad.vars.get('foreground')
    defaults.font_family = sketchpad.vars.get('font_family')
    defaults.font_size = sketchpad.vars.get('font_size')
    defaults.font_bold = sketchpad.vars.get('font_bold')
    defaults.font_italic = sketchpad.vars.get('font_italic')
    defaults.html = 'yes'
    defaults.text = null
    defaults.x = null
    defaults.y = null

    // Inherited.
    super(sketchpad, script, defaults)
  }
  
  drawText(styles) {
    this.sketchpad.canvas.text(this._properties.text, this._properties.center,
      this._properties.x, this._properties.y, this._properties.html,
      styles)
    this._isDrawn = true
  }

  /** Implements the draw phase of an element. */
  draw () {
    // Inherited.
    super.draw()
    // Create a styles object containing style information
    const styles = new Styles()
    styles.color = this._properties.color
    styles.font_family = this._properties.font_family
    styles.font_size = Number(this._properties.font_size)
    styles.font_italic = (this._properties.font_italic === 'yes')
    styles.font_bold = (this._properties.font_bold === 'yes')
    styles.font_underline = (this._properties.font_underline === 'yes')
    this._isDrawn = false
    // If the font family is not among the default fonts, we attempt to load it
    // dynamically from Google Fonts. The resulting promise should always 
    // resolve, regardless of whether this worked or not
    if (Object.values(styles._DEFAULT_FONTS).indexOf(styles.font_family) < 0) {
        const promise = new Promise((resolve, reject) => {
          WebFont.load({
            google: {
              families: [styles.font_family]
            },
            // The active event is called when the font is succesfully loaded
            active: () => {
              console.log(`font loaded: ${styles.font_family}`)
              this.drawText(styles)
              resolve()
            },
            // The inactive event is called when the font couldn't be loaded
            inactive: () => {
              console.warn(`failed to load font: ${styles.font_family}`)
              this.drawText(styles)
              resolve()
            }
          })
        })
        // We create a separate timeout promise to make sure that the font 
        // loader doesn't hang (because it tends to hand indefinitely). When
        // a timeout occurs, we draw the text anyway. It's unclear why for
        // some fonts the inactive event above isn't called, but this timeout
        // deals with that.
        const timeout = new Promise((resolve, reject) => {
          setTimeout(() => {
            if (!this._isDrawn) {
                console.warn(`font loading timed out: ${styles.font_family}`)
                this.drawText(styles)
            }
            resolve()
          }, 3000)
        })
        // The promise resolves when either the font loader resolves or the
        // timeout, whichever happens first
        return Promise.race([promise, timeout])
    }
    // For the default fonts, we return a dummy promise that resolves right
    // away
    return new Promise((resolve) => {
      this.drawText(styles)
      resolve()
    })
  }
}
