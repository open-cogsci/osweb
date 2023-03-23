import Item from './item.js'
import { constants } from '../system/constants.js'

/**
 * Class representing a logger item.
 * @extends Item
 */
export default class Logger extends Item {
  /**
     * Create an experiment item which controls the OpenSesame experiment.
     * @param {Object} pExperiment - The experiment item to which the item belongs.
     * @param {String} pName - The unique name of the item.
     * @param {String} pScript - The script containing the properties of the item.
     */
  constructor (experiment, name, script) {
    super(experiment, name, script)
    this.description = 'Logs experimental data'
    this.from_string(script)
  }

  /** Implements the complete phase of an item. */
  _complete () {
    // Inherited.
    super._complete()
  }

  /** Reset all item variables to their default value. */
  reset () {
    this.logvars = []
    this.exclude_patterns = []
    this.vars.set('auto_log', 'yes')
  }

  /**
     * Parse a definition string and retrieve all properties of the item.
     * @param {String} script - The script containing the properties of the item.
     */
  from_string (script) {
    this.reset()
    let key
    let val
    if (script !== null) {
      var lines = script.split('\n')
      for (var i = 0; i < lines.length; i++) {
        if ((lines[i] !== '') && (this.parse_variable(lines[i]) === false)) {
          var tokens = this.syntax.split(lines[i])
          if (tokens.length > 1) {
            key = tokens[0]
            val = this.syntax.remove_quotes(tokens[1])
            if (key === 'log') {
              this.logvars.push(val)
            } else if (key === 'exclude') {
              // Convert the unix-style filename pattern matching to regular
              // expressions.
              this.exclude_patterns.push(new RegExp(
                val.replaceAll('\*', '.*').replaceAll('\?', '.')))
            }
          }
        }
      }
    }
    this.logvars.sort()
  }

  /** Implements the run phase of an item. */
  run () {
    super.run()
    if (this._status !== constants.STATUS_FINALIZE) {
      this._status = constants.STATUS_FINALIZE
      this.set_item_onset()
      let logvars = this.logvars
      if (this.vars.get('auto_log') === 'yes')
        logvars = logvars.concat(this.experiment.vars.inspect())
      for (const exclude_pattern of this.exclude_patterns)
        logvars = logvars.filter(
          (key) => { return !key.match(exclude_pattern) })
      this.experiment._log.write_vars(logvars.sort())
      this._complete()
    }
  }
}
