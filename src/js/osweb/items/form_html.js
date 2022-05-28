import Item from '../items/item.js'

/**
 * Base class for implementing HTML forms. These forms briefly hide the OSWeb
 * canvas and replace it by an HTML div. When the form is finished, OSWeb is
 * re-activated.
 * @extends Item
 */
export default class FormHTML extends Item {

  constructor (experiment, name, script) {
    super(experiment, name, script)
    this._widgets = []  // avoid crashes when parsing widgets command
    this.from_string(script)
  }
  
  reset() {
    super.reset()
    this.vars.margins = '50;50;50;50'
  }
  
  /**
   * Generates an array of HTML elements that are appended to the form. Should
   * be overridden in the actual form classes.
   * @return {!Array<Object>} - an array of HTML elements
   **/
  formElements() {
      return []
  }
  
  /**
   * Gives HTML code to be used for the form. Should be overridden in the
   * actual form classes.
   * @return {string}
   **/
  formHTML() {
    return null
  }
  
  /**
   * Hides the form container and re-enables OSWeb. Also re-enablees the event
   * listeners.
   **/
  resumeOSWeb () {
    this._formContainer.remove()
    this._osweb.style.display = 'flex'
    window.addEventListener('keydown', runner._events._keyDownHandler)
    window.addEventListener('keyup', runner._events._keyUpHandler)
    this._complete()
  }
  
  /**
   * Executes script elements that are embedded in the form
   **/
  _runScripts () {
    for (const script of this._customForm.getElementsByTagName('script')) {
      this.experiment._javascriptWorkspace._eval(script.textContent)
    }
  }
  
  /**
   * Emulates the 'gray' which is applied to buttons.
   **/
  applyTheme (element, setBackground=false) {
    if (this.vars.get('_theme') !== 'gray')
      return
    if (setBackground)
      element.style.backgroundColor = '#888a85'
    element.style.borderTop = 'solid 1px #babdb6'
    element.style.borderLeft = 'solid 1px #555753'
    element.style.borderRight = 'solid 1px #555753'
    element.style.borderBottom = 'solid 1px #555753'
  }
  
  /**
   * Returns an HTML element. If inherit is specified
   * @param {string} type - an HTML element type, such as 'div'
   * @param {string} html - the inner HTML content
   * @param {number} height - proportion of full height
   * @param {number} width - proportion of full height
   * @param {boolean} inherit - Indicates whether font style should be
   *     inherited from the container element.
   * @return {Object} - an HTML element
   **/
  element (type, html, height, width=1, inherit=true) {
    const element = document.createElement(type)
    // Replace all newlines by <br> tags
    if ((typeof html !== "undefined") && (html !== null)) element.innerHTML = html.replace(/\n/g, '<br>')
    if (typeof height !== "undefined") element.style.height = this._paddedHeight * height - 40 + 'px'
    if (typeof width !== "undefined")element.style.width = this._paddedWidth * width - 40 + 'px'
    element.style.padding = '10px'
    element.style.margin = '10px'
    if (inherit) {
      element.style.fontFamily = 'inherit'
      element.style.fontSize = 'inherit'
      element.style.fontWeight = 'inherit'
      element.style.textDecoration = 'inherit'
      element.style.color = 'inherit'
      element.style.backgroundColor = 'inherit'
    }
    return element
  }
  
  /**
   * Builds a container div with a checkbox/ radio button and a label next to
   * it. See element() for explanation of parameters.
   * @param {string} boxtype - radio/ checkbox
   * @param {string} label - a text label
   * @param {number} height
   * @param {number} width
   * @param {boolean} inherit
   * @return {!Array<Object>}
   **/
  checkbox (boxType, label, height, width=1, inherit=true) {
    const box = this.element('input', null, null, null)
    box.type = boxType
    box.value = label
    const labelElement = this.element('label', label, null, null)
    const container = this.element('div', null, height, width, inherit)
    container.style.textAlign = 'left'
    container.append(box)
    container.append(labelElement)
    return [container, box]
  }
  
  /**
   * Maps the font family onto names that browsers understand.
   * @returns {string}
   **/
  get _fontFamily () {
    const fontFamily = this.vars.get('font_family')
    if (fontFamily === 'sans')
      return 'sans-serif'
    if (fontFamily === 'mono')
      return 'monospace'
    return fontFamily
  }
  
  /**
   * Gets the padding for all four sides based on the margins variable.
   * @returns {!Array<number>}
   **/
  get _padding () {
    if (typeof this._cached_padding === "undefined")
      this._cached_padding = String(this.vars.get('margins')).split(';').map(Number)
    return this._cached_padding
  }
  
  /**
   * Gets the width that takes into account the padding
   * @returns {number}
   **/
  get _paddedWidth () {
    if (typeof this._width === "undefined") {
      const [top, right, bottom, left] = this._padding
      this._width = this.experiment._runner._renderer.view.clientWidth - right - left
    }
    return this._width
  }
  
  /**
   * Gets the height that takes into account the padding
   * @returns {number}
   **/
  get _paddedHeight () {
    if (typeof this._height === "undefined") {
      const [top, right, bottom, left] = this._padding
      this._height = this.experiment._runner._renderer.view.clientHeight - top - bottom
    }
    return this._height
  }
  
  run () {
    // The main container that contains the form elements
    this._customForm = document.createElement('div')
    this._customForm.style.color = this.vars.get('foreground')
    this._customForm.style.backgroundColor = this.vars.get('background')
    this._customForm.style.fontSize = this.vars.get('font_size') + 'px'
    this._customForm.style.fontFamily = this._fontFamily
    if (this.vars.get('font_bold')=== 'yes')
      this._customForm.style.fontWeight = 'bold'
    if (this.vars.get('font_italic')=== 'yes')
      this._customForm.style.fontStyle = 'italic'
    if (this.vars.get('font_underline') === 'yes')
      this._customForm.style.textDecoration = 'underline'
    // Convert margins from '50;50;50;50' to '50px 50px 50px 50px'
    this._customForm.style.padding = this._padding.join('px ') + 'px'
    this._customForm.style.width = this._paddedWidth + 'px'
    this._customForm.style.height = this._paddedHeight + 'px'
    this._customForm.style.textAlign = 'center'
    for (const element of this.formElements())
      this._customForm.append(element)
    const html = this.formHTML()
    if (html !== null)
      this._customForm.innerHTML = html
    // A container that centers the form
    this._formContainer = document.createElement('div')
    this._formContainer.style.justifyContent = 'center'
    this._formContainer.style.alignItems = 'center'
    this._formContainer.style.display = 'flex'
    this._formContainer.style.height = '100%'
    this._formContainer.append(this._customForm)
    this._osweb = document.getElementsByClassName('justify-content-center')[0]
    document.body.append(this._formContainer)
    this._osweb.style.display = 'none';
    window.removeEventListener('keydown', runner._events._keyDownHandler)
    window.removeEventListener('keyup', runner._events._keyUpHandler)
    this._runScripts()
  }
}
