/** Class representing a variable store. */
export default class VarStore {
  /**
   * Create a variable store object for all variables.
   * @param {Object} item - The item to which the var_store belongs.
   * @param {Object} parent - The parent global var_store.
   */
  constructor (item, parent = null) {
    // Create and set private properties.
    this._item = item
    this._parent = parent
    this._scope = this
    this._registered = []
    this._ignored_properties = [
      '_item', '_parent', '_bypass_proxy', '_ignored_properties'
    ]
  }

  /**
   * Get the value of a variable from the store (or thje parent store).
   * @param {String} variable - The name of the variable.
   * @param {Object} evaluate - The parent global var_store.
   * @param {object} defaultValue - A default value for if the variable is not
   *   found. If no default is specified, an error is thrown if the variable
   *   is not found.
   * @return {Boolean|Number|String} - The value of the given variable.
   */
  get (variable, evaluate = true, defaultValue = null) {
    var value = null
    // Gets an experimental variable.
    if (variable in this._scope) {
      this._bypass_proxy = true // Avoid Proxy feedback loop
      if (typeof this._scope[variable] === 'string' && evaluate === true) {
        value = this._item.syntax.eval_text(this._scope[variable])
      } else {
        value = this._scope[variable]
      }
      this._bypass_proxy = false
    }
    // If value is not found locally, look in experiment object.
    if (value == null && this._parent && variable in this._parent._scope) {
      this._parent._bypass_proxy = true // Avoid Proxy feedback loop
      if (typeof this._parent._scope[variable] === 'string' && evaluate === true) {
        value = this._item.syntax.eval_text(this._parent._scope[variable])
      } else {
        value = this._parent._scope[variable]
      }
      this._parent._bypass_proxy = false
    }
    if (value === null) {
      if (defaultValue !== null)
        return defaultValue
      throw `VariableDoesNotExist: Variable ${variable} does not exist`
    }
    return value
  }

  /**
   * Check if the variable is part of the variable store.
   * @param {String} variable - The name of the variable.
   * @return {Boolean} - True if the variable is part of the store.
   */
  has (variable) {
    return this.inspect().includes(variable)
  }

  /** Create a list of all avariables available.
   * @return {Array} - Array containing names of all variables.
   */
  inspect () {
    const variables = []
    for (const variable in this._scope) {
      // If a variable hasn't been explicitly registered using vars.set, then
      // it is only returned under particular conditions.
      if (!this._registered.includes(variable)) {
        if (this._ignored_properties.includes(variable))
          continue
        // Don't return hidden variables prefixed with _
        if (variable.startsWith('_'))
          continue
        // Only return variables of standard types to keep the log file clean
        if (!['number', 'string', 'boolean'].includes(typeof this._scope[variable]))
          continue
      }
      variables.push(variable)
    }
    return variables
  }

  /** Create a list of value/name pairs.
   * @return {Array} - Array containing name and values of all variables.
   */
  items () {
    const pairs = {}
    for (const variable of this.inspect()) {
      pairs[variable] = this._scope[variable]
    }
    return pairs
  }

  /**
   * Set the value of a variable in the store.
   * @param {String} variable - The name of the variable.
   * @value {Boolean|Number|String} - Value of the variable to set.
   */
  set (variable, value) {
    if (!this._registered.includes(variable))
      this._registered.push(variable)
    this._scope[variable] = value
  }

  /**
   * Unset (remove) a variable from the store.
   * @param {String} variable - The name of the variable.
   */
  unset (variable) {
    if (this.has(variable) === true) {
      delete this._scope[variable]
    }
  }

  /** Create a list of variable names.
   * @return {Array} - Array containing namesof all variables.
   */
  vars () {
    return this.inspect()
  }

  /**
   * Clears all experimental variables, except those that are explicitly
   * preserved.
   * @param {Array} preserve - An array of variable names to preserve.
   */
  clear (preserve = []) {
    for (const variable of this.inspect()) {
      if (preserve.includes(variable)) continue
      this.unset(variable)
    }
  }
}
