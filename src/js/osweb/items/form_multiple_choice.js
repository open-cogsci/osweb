import FormHTML from './form_html.js'

/**
 * Class representing a form-mulitple-choice item.
 * @extends FormHTML
 */
export default class FormMultipleChoice extends FormHTML {

  resumeOSWeb () {
    const values = []
    for (const box of this._boxes) {
        if (box.checked)
            values.push(box.value)
    }
    this.experiment.vars.set(
        this.vars.form_var,
        (values.length > 0) ? values.join(';') : 'no'
    )
    super.resumeOSWeb()
  }
  
  _boxClicked () {
    if (!this._hasOkButton)
      setTimeout(this.resumeOSWeb.bind(this), 100)
  }

  formElements () {
    this._hasOkButton = (this.vars.get('advance_immediately') === 'no' || boxType === 'checkbox')
    const elements = []
    this._boxes = []
    // Create an array of non-empty options
    const options = String(this.vars.get('options')).split('\n').filter(
        option => option .trim().length > 0)
    const boxType = (this.vars.get('allow_multiple') === 'no') ? 'radio' : 'checkbox'
    const elementHeight = 1 / (options.length + (this._hasOkButton ? 3 : 2))
    const title = this.element('h1', this.vars.get('form_title'), elementHeight, 1)
    elements.push(title)
    const question = this.element('p', this.vars.get('question'), elementHeight, 1)
    elements.push(question)
    for (const option of options) {
      const [container, box] = this.checkbox(boxType, option, elementHeight)
      box.name = 'options'
      box.onclick = this._boxClicked.bind(this)
      this._boxes.push(box)
      elements.push(container)
    }
    if (this._hasOkButton) {
      const okButton = this.element('input', null, elementHeight, 1 / 3)
      okButton.style.width = '100%'
      this.applyTheme(okButton, true)
      okButton.type = 'button'
      okButton.value = this.vars.get('button_text')
      okButton.onclick = this.resumeOSWeb.bind(this)
      elements.push(okButton)
    }
    return elements
  }
}
