import FormHTML from './form_html.js'

/**
 * Class representing custom HTML code
 * @extends FormHTML
 */
export default class InlineHTML extends FormHTML {

  reset() {
    super.reset()
    this.vars.html = ''
  }

  /**
   * @return {string} - the HTML content
   **/
  formHTML() {
    return this.vars.get("html")
  }
  
  /**
   * Sets experimental variables based on the name properties of input elements
   * and then resumes OSWeb.
   **/
  _submitForm() {
    for (const input of document.getElementsByTagName('input')) {
      if (!input.required)
        continue
      if ((['checkbox', 'radio'].includes(input.type) && (!input.checked)) ||
          (!['checkbox', 'radio'].includes(input.type) && (input.value === ''))) {
        alert('One or more required input fields are empty or have not been checked')
        return
      }
    }
    for (const input of document.getElementsByTagName('input')) {
      if (!['checkbox', 'radio'].includes(input.type) || input.checked)
        this.experiment.vars.set(input.name, input.value)
    }
    this.resumeOSWeb()
  }
  
  run () {
    super.run()
    // Disable the submit action of form elements, in case the user has added
    // (unnecessary) form tags
    for (const form of document.getElementsByTagName('form'))
      form.onsubmit = (() => false)
    // Bind input elements of type submit to the custom submit action
    for (const input of document.getElementsByTagName('input')) {
      if (input.type === 'submit')
        input.onclick = this._submitForm.bind(this)
    }
  }

}
