import FormHTML from './form_html.js'

/**
 * Class representing a form text input item.
 * @extends FormHTML
 */
export default class FormTextInput extends FormHTML {

  /**
   * Is called when a key is pressed in the textarea, and accepts the form
   * input when return is pressed by setting the response variable to the
   * value of the textarea.
   **/
  checkReturnPress (event) {
    if (event.keyCode !== 13)
      return
    this.experiment.vars.set(this.vars.get('form_var'), this._textArea.value)
    this.resumeOSWeb()
  }

  formElements () {
    const title = this.element('h1', this.vars.get('form_title'), 1 / 8)
    const question = this.element('p', this.vars.get('form_question'), 1 / 8)
    question.style.textAlign = 'left'
    this._textArea = this.element('textarea', null, 6 / 8)
    this.applyTheme(this._textArea, false)
    return [title, question, this._textArea]
  }
  
  _activateTextArea () {
    this._textArea.focus()
    this._textArea.onkeypress = this.checkReturnPress.bind(this)
  }
  
  run () {
    super.run()
    // The textarea is activate after a very short timeout. This avoid previous
    // keypress from being entered as text immediately.
    setTimeout(this._activateTextArea.bind(this), 10)
  }
}
