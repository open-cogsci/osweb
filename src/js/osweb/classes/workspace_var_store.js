import VarStore from '../classes/var_store.js'

/** Class representing a the var store of the main experiment item, which maps
 *  onto the JavaScript workspace.
 **/
export default class WorkspaceVarStore extends VarStore {

  constructor(item, parent = null) {
    super(item, parent)
    this._scope = window
  }

}
