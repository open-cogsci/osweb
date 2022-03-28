/**
 * Base class for Mouse and Keyboard
 */
export default class ResponseDevice {
  constructor () {
    this._SYNONYM_MAP = []
  }
  /**
   * Convert all response values to their default values (remove synonyms).
   * @param {Array} responses - A list of response values.
   * @return {Array} - List of default values for the given responses.
   */
  _get_default_from_synonym (responses) {
    const defaults = []
    let synonyms
    for (let response of responses) {
      synonyms = this._synonyms(response)
      if (synonyms === null) {
        throw new ReferenceError(`Unknown key '${response}'`)
      }
      defaults.push(synonyms[0])
    }
    return defaults
  }
  
  /**
   * Get all synonyms for a response value
   * @param {String} button - A response.
   * @return {Array|Null} - All synonyms or null if the response is unknown
   */
  _synonyms (response) {
    if (typeof response === 'undefined')
      return null
    for (let synonyms of this._SYNONYM_MAP) {
      if (synonyms.includes(response) || synonyms.includes(response.toLowerCase()))
        return synonyms
    }
    return [response]
  }

  /** Clear all pending keyboard input. */
  flush () {
    // Always returns false because flusihing is not possible.
    return false
  }

}
