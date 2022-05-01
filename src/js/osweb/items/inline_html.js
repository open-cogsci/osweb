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
      if ((['checkbox', 'radio'].includes(input.type) && (!this._groupChecked(input))) ||
          (!['checkbox', 'radio'].includes(input.type) && (input.value === ''))) {
        alert('One or more required input fields are empty or have not been checked')
        return
      }
    }
    for (const input of document.getElementsByTagName('input')) {
      if (['checkbox', 'radio'].includes(input.type)) {
        // If a checkbox or radio button is checked, set the value to the `id`
        // attribute if an `id` attribute has been defined. This is especially
        // important for radio-group buttons, which all share the same `name`
        // attribute. If no `id` has been defined, fall back to the `value`
        // attribute, which is 'on' for checked elements.
        if (input.checked) {
          this.experiment.vars.set(input.name, (input.id !== '' ? input.id : input.value))
        }
      } else {
        this.experiment.vars.set(input.name, input.value)
      }
    }
    this.resumeOSWeb()
  }
  
  /**
   * Checks where any element from a group of input elements is checked. This
   * allows for the required attribute to serve as expected for radio-button
   * groups.
   **/
  _groupChecked (input) {
    if (input.name === "")
      return input.checked
    for (input of document.getElementsByName(input.name)) {
      if (input.checked)
        return true
    }
    return false
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
