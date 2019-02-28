/** Class representing a variable store. */
class VarStore {
  /**
   * Create a variable store object for all variables.
   * @param {Object} item - The item to which the var_store belongs.
   * @param {Object} parent - The parent global var_store.
   */
  constructor (item, parent) {
    // Create and set private properties.
    this._item = item
    this._parent = parent
  };

  /**
   * Get the value of a variable from the store (or thje parent store).
   * @param {String} variable - The name of the variable.
   * @param {Boolean|Number|String} defaultValue - The default value for the variable.
   * @param {Object} evaluate - The parent global var_store.
   * @param {Object} valid - The parent global var_store.
   * @return {Boolean|Number|String} - The value of the given variable.
   */
  get (variable, defaultValue, evaluate, valid) {
    // Gets an experimental variable.
    let value = defaultValue || null
    if (this.has(variable)) {
      if (typeof this[variable] === 'string') {
        value = this._item.syntax.eval_text(this[variable], null, true)
      } else {
        value = this[variable]
      }
    }
    // If value is not found locally, look in experiment object.
    if (value === null && this._parent && this._parent.has(variable)) {
      if (typeof this._parent[variable] === 'string') {
        value = this._item.syntax.eval_text(this._parent[variable], null, true)
      } else {
        value = this._parent[variable]
      }
    }

    // Return function result.
    return value
  }

  /**
   * Check if the variable is part of the variable store.
   * @param {String} variable - The name of the variable.
   * @return {Boolean} - True if the variable is part of the store.
   */
  has (variable) {
    // Check if the variable (property) is part of the class.
    return this.hasOwnProperty(variable)
  }

  /** Create a list of all avariables available.
   * @return {Array} - Array containing names of all variables.
   */
  inspect () {
    // Get all variable values.
    var keys = []
    for (var key in this) {
      keys.push(key)
    }

    // Slide default properties (HACK for removing the defauly properties/methods from the log_list).
    keys = keys.slice(2, -7)

    // Return function result.
    return keys
  }

  /** Create a list of value/name pairs.
   * @return {Array} - Array containing name and values of all variables.
   */
  items () {}

  /**
   * Set the value of a variable in the store.
   * @param {String} variable - The name of the variable.
   * @value {Boolean|Number|String} - Value of the variable to set.
   */
  set (variable, value) {
    // Sets and experimental variable.
    this[variable] = value
  }

  /**
   * Unset (remove) a variable from the store.
   * @param {String} variable - The name of the variable.
   */
  unset (variable) {
    // Check if the variable exists.
    if (this.has(variable) === true) {
      // Remove the variable as property from the object.
      delete this[variable]
    }
  }

  /** Create a list of variable values.
   * @return {Array} - Array containing values of all variables.
   */
  vars () {}
}

const varStoreHandler = {
  construct (Target, args) {
    return new Proxy(new Target(...args), {
      get (target, prop) {
        return typeof target[prop] === 'string'
          ? target.get(prop)
          : target[prop]
      }
    })
  }
}

export default new Proxy(VarStore, varStoreHandler)
