import isInteger from 'lodash/isInteger'
import isArray from 'lodash/isArray'
import colorConvert from 'color-convert'

const colorHex = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i
const colorRGB255 = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i
const colorRGBPerc = /rgb\(\s*([+-]?([0-9]+([.][0-9]*)?|[.][0-9]+))\s*%\s*,\s*([+-]?([0-9]+([.][0-9]*)?|[.][0-9]+))\s*%\s*,\s*([+-]?([0-9]+([.][0-9]*)?|[.][0-9]+))\s*%\s*\)/i
const colorHSV = /hsv\(\s*([+-]?([0-9]+([.][0-9]*)?|[.][0-9]+))\s*\s*,\s*([+-]?([0-9]+([.][0-9]*)?|[.][0-9]+))\s*%\s*,\s*([+-]?([0-9]+([.][0-9]*)?|[.][0-9]+))\s*%\s*\)/i
const colorHSL = /hsl\(\s*([+-]?([0-9]+([.][0-9]*)?|[.][0-9]+))\s*\s*,\s*([+-]?([0-9]+([.][0-9]*)?|[.][0-9]+))\s*%\s*,\s*([+-]?([0-9]+([.][0-9]*)?|[.][0-9]+))\s*%\s*\)/i
const colorLAB = /lab\(\s*([+-]?([0-9]+([.][0-9]*)?|[.][0-9]+))\s*\s*,\s*([+-]?([0-9]+([.][0-9]*)?|[.][0-9]+))\s*\s*,\s*([+-]?([0-9]+([.][0-9]*)?|[.][0-9]+))\s*\s*\)/i

/** Class representing a style container. */
export default class Styles {
  /** Styles is a simple class that holds information about the style. */
  constructor (item) {
    this._initConstants()
    // Set class private properties.
    if (typeof (item) === 'undefined') {
      this._background_color = 0x000000
      this._color = 'white'
      this._fill = false
      this._font_bold = false
      this._font_family = 'Arial'
      this._font_italic = false
      this._font_size = 24
      this._font_underline = false
      this._html = false
      this._penwidth = 1
    } else {
      this.background_color = item.vars.get('background', true, 0x000000)
      this.color = item.vars.get('foreground', true, 'white')
      this.fill = item.vars.get('fill', true, 'no') === 'yes'
      this.font_bold = item.vars.get('font_bold', true, 'no')
      this.font_family = item.vars.get('font_family', true, 'Arial')
      this.font_italic = item.vars.get('font_italic', true, 'no')
      this.font_size = item.vars.get('font_size', true, 24)
      this.font_underline = item.vars.get('font_underline', true, 'no')
      this.html = item.vars.get('html', true, 'no')
      this.penwidth = item.vars.get('penwidth', true, 1)
    }
  }

  /**
   * Converts a color value to a numeric value for use in PIXI. This should
   * accept all color specifications as described here:
   * - https://osdoc.cogsci.nl/3.3/manual/python/canvas/#colors
   * @param {String|Number|Object} color - The color to convert.
   * @return {Number} - The color value.
   */
  _convertColorValue (color) {
    const [r, g, b] = this._convertColorValueToRGB(color).map(Math.round)
    return 65536 * r + 256 * g + b
  }
  
  /**
   * Extracts three float numbers from a color based on a regular expression
   * that matches three float numbers.
   * @param {String} color
   * @return {Array<Number>}
   **/
  _matchFloats(color, re) {
    const m = color.match(re)
    return [m[1], m[4], m[7]].map(Number)
  }

  _convertColorValueToRGB (color) {
    if (typeof (color) === 'string') {
      color = color.toLowerCase()
      const rgb = colorConvert.keyword.rgb(color)
      if (typeof rgb !== 'undefined')
        return rgb
      if (colorHex.test(color) === true)
        return colorConvert.hex.rgb(color)
      if (colorRGB255.test(color) === true)
        return color.match(colorRGB255).slice(1, 4).map(Number)
      if (colorRGBPerc.test(color) === true)
        return this._matchFloats(color, colorRGBPerc).map(
            perc => perc * 2.55)
      if (colorHSV.test(color) === true)
        return colorConvert.hsv.rgb(this._matchFloats(color, colorHSV))
      if (colorHSL.test(color) === true)
        return colorConvert.hsl.rgb(this._matchFloats(color, colorHSL))
      if (colorLAB.test(color) === true)
        return colorConvert.lab.rgb(this._matchFloats(color, colorLAB))
      if (!isNaN(Number(color)))  // For single numbers a strings
        color = Number(color)
    }
    if (isInteger(color))
      return [color, color, color]
    if (isArray(color) && color.length == 3)
      return color.map(Number)
    throw 'Invalid color specification: ' + color + ' (' + typeof color + ')'
  }

  get rgb () {
    return this._convertColorValue(this._background_color)
  }

  set rgb (val) {
  }

  /**
   * Checks if the passed value is an integer.
   * @param {Number} value -  The value to check.
   * @return {Boolean} - True if passed value is an integer.
   */
  _isInt (value) {
    return isInteger(value)
  }

  /**
   * Checks if value is possibly specified as 'yes'/'no' or 1/0 instead of
   * true or false (as is done in OS script). Convert 'yes' and 'no' values
   * to booleans
   * @param {Number|String} value - The value to check.
   * @return {Boolean} - The original boolean, or true if value was 'yes'.
   */
  _checkVal (value) {
    return [true, 'yes', 1, '1'].indexOf(value) !== -1
  }

  /**
   * Get the background_color value.
   * @return {String} The background_color value.
   */
  get background_color () {
    return this._background_color
  }

  /**
   * Set the background_color value.
   * @param {Number|String} val - The background_color value to set.
   */
  set background_color (val) {
    this._background_color = this._convertColorValue(val, 'number')
  }

  /**
   * Get the color value.
   * @return {String} The color value.
   */
  get color () {
    return this._color
  }

  /**
   * Set the color value.
   * @param {Number|String} val - The color value to set.
   */
  set color (val) {
    this._color = this._convertColorValue(val, 'number')
  }

  /**
   * Get the fill value.
   * @return {Boolean} The fill value.
   */
  get fill () {
    return this._fill
  }

  /**
   * Set the fill value.
   * @param {Boolean} val - The fill value to set.
   */
  set fill (val) {
    this._fill = ([1, '1', true, 'yes'].indexOf(val) !== -1)
  }

  /**
   * Get the font_bold value.
   * @return {Boolean} The font_bold value.
   */
  get font_bold () {
    return this._font_bold
  }

  /**
   * Set the font_bold value.
   * @param {Boolean} val - The font_bold value to set.
   */
  set font_bold (val) {
    this._font_bold = this._checkVal(val)
  }

  /**
   * Get the font_family value.
   * @return {String} The font_family value.
   */
  get font_family () {
    return this._font_family
  }

  /**
   * Set the font_family value.
   * @param {String} val - The font_family value to set.
   */
  set font_family (val) {
    if (val in this._DEFAULT_FONTS) {
      this._font_family = this._DEFAULT_FONTS[val]
    } else {
      this._font_family = val
    }
  }

  /**
   * Get the font_italic value.
   * @return {Boolean} The font_italic value.
   */
  get font_italic () {
    return this._font_italic
  }

  /**
   * Set the font_italic value.
   * @param {Boolean} val - The font_bold value to set.
   */
  set font_italic (val) {
    this._font_italic = this._checkVal(val)
  }

  /**
   * Get the font_size value.
   * @return {Number} The font_size value.
   */
  get font_size () {
    return this._font_size
  }

  /**
   * Set the font_size value.
   * @param {Number} val - The font_size value to set.
   */
  set font_size (val) {
    if (!this._isInt(val)) {
      // remove px part
      this._font_size = Number(val.slice(0, -2))
    } else {
      this._font_size = val
    }
  }

  /**
   * Get the font_underline value.
   * @return {Boolean} The font_underline value.
   */
  get font_underline () {
    return this._font_underline
  }

  /**
   * Set the font_underline value.
   * @param {Boolean} val - The font_underline value to set.
   */
  set font_underline (val) {
    this._font_underline = this._checkVal(val)
  }

  /**
   * Get the html value.
   * @return {Boolean} The html value.
   */
  get html () {
    return this._html
  }

  /**
   * Set the html value.
   * @param {Boolean} val - The html value to set.
   */
  set html (val) {
    this._html = this._checkVal(val)
  }

  /**
   * Get the penwidth value.
   * @return {Boolean} The penwidth value.
   */
  get penwidth () {
    return this._penwidth
  }

  /**
   * Set the penwidth value.
   * @param {Boolean} val - The penwidth value to set.
   */
  set penwidth (val) {
    if (!this._isInt(val)) {
      this._penwidth = 1
    }
    this._penwidth = val
  }

  _initConstants () {
    this._DEFAULT_FONTS = {
      sans: 'Droid Sans',
      serif: 'Droid Serif',
      mono: 'Droid Sans Mono',
      'chinese-japanese-korean': 'WenQuanYi Micro Hei',
      arabic: 'Droid Arabic Naskh',
      hebrew: 'Droid Sans Hebrew',
      hindi: 'Lohit Hindi'
    }
  }
}
