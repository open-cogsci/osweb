import VarStore from '../classes/var_store.js'

/** Class representing a the var store of the main experiment item, which maps
 *  onto the JavaScript workspace.
 **/
export default class WorkspaceVarStore extends VarStore {

  constructor(item, parent = null) {
    super(item, parent)
    this._scope = window
    if (typeof jatos !== 'undefined') {
      // JATOS uses a special mechanism to pass query parameters
      for (const param in jatos.urlQueryParameters) {
        let val = jatos.urlQueryParameters[param]
        console.log(`JATOS query parameter: ${param} = ${val}`)
        this.set(param, item.syntax.convert_if_numeric(val))
      }
    } else {
      // When running outside of JATOS we use the standard URL query parameters
      const urlParams = new URLSearchParams(window.location.search)
      for (const [param, val] of urlParams) {
        console.log(`URL query parameter: ${param} = ${val}`)
        this.set(param, item.syntax.convert_if_numeric(val))
      }
    }
  }
}
