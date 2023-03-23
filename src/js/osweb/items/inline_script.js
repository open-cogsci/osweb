import Item from './item.js'

/**
 * Class representing an inline item.
 * @extends Item
 */
export default class InlineScript extends Item {
  /**
     * Create an inline item which executes inline python code.
     * @param {Object} experiment - The experiment item to which the item belongs.
     * @param {String} name - The unique name of the item.
     * @param {String} script - The script containing the properties of the item.
     */
  constructor (experiment, name, script) {
    // Inherited create.
    super(experiment, name, script)

    // Define and set the public properties.
    this.description = 'Executes Python code'

    // Define and set the public properties.
    this._prepare_run = false
    this._prepare_tree = null
    this._run_tree = null

    // Process the script.
    this.from_string(script)
  }

  /** Implements the complete phase of an item. */
  _complete () {
    // Check if the parser is in pause mode and must be restarted.
    if (this.experiment._runner._pythonParser._status === 1) {
      // Process the current active node.
      this.experiment._runner._pythonParser._process_nodes()
    } else {
      if (this._prepare_run === true) {
        // Inherited prepare.
        super.prepare()
      } else {
        // Inherited.
        super._complete()
      }
    }
  }

  /** Implements the complete script phase of an item. */
  _complete_script () {
    // Added for video script functionaliry.
    this._complete()
  }

  /** Reset all item variables to their default value. */
  reset () {
    this.vars.set('_prepare', '')
    this.vars.set('_run', '')
  }

  /** Implements the prepare phase of an item. */
  prepare () {
    // Compile the script code to ast trees.
    this._prepare_tree = this.experiment._runner._pythonParser._parse(this.vars.get('_prepare'))
    this._run_tree = this.experiment._runner._pythonParser._parse(this.vars.get('_run'))

    // Execute the run code.
    if (this._prepare_tree !== null) {
      // Set the current item.
      this.experiment._runner._events._currentItem = this

      // Set the prepare run toggle.
      this._prepare_run = true

      // Record the onset of the current item.
      this.set_item_onset()

      // Start the parser
      this.experiment._runner._pythonParser._run(this, this._prepare_tree)
    } else {
      // Inherited.
      super.prepare()
    }
  }

  /** Implements the run phase of an item. */
  run () {
    // Inherited.
    super.run()

    // Set the prepare run toggle.
    this._prepare_run = false

    // Record the onset of the current item.
    this.set_item_onset()

    // Execute the run code.
    if (this._run_tree !== null) {
      // Start the parser
      this.experiment._runner._pythonParser._run(this, this._run_tree)
    } else {
      // To prevent prepeare script from running twice.
      this.experiment._runner._pythonParser._status = 0

      // No script, so jump to compelte.
      this._complete()
    }
  }
}
