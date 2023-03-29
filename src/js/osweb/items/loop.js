import {
  isNumber,
  isArray,
  shuffle,
  sortBy
} from 'lodash'

import {
  constants
} from '../system/constants.js'
import Item from './item.js'

import {
  fullfactorial,
  shuffleVert,
  shuffleHoriz,
  sortCol,
  reverseRows,
  roll,
  weight
} from '../util/matrix'

import parse from "csv-parse/lib/sync"


/**
 * Class representing a sequence item.
 * @extends Item
 */
export default class Loop extends Item {
  /**
   * Create an experiment item which controls the OpenSesame experiment.
   * @param {Object} experiment - The experiment item to which the item belongs.
   * @param {String} name - The unique name of the item.
   * @param {String} script - The script containing the properties of the item.
   */
  constructor (experiment, name, script) {
    // Inherited create.
    super(experiment, name, script)

    // Definition of public properties.
    this.description = 'Repeatedly runs another item'
    this.matrix = null

    // Definition of private properties.
    this._break_if = ''
    this._cycles = []
    this._index = 0
    this._keyboard = null
    this._operations = []
    this._initialized = false

    // Process the script.
    this.from_string(script)
  }

  /** Implements the complete phase of an item. */
  _complete () {
    this._status = constants.STATUS_FINALIZE
    super._complete()
  }

  /**
   * Scans the provided list of argument for variables and retrieves them if found.
   * The function works recursively and thus also parses elements inside arrays that are part of
   * args.
   *
   * @param {array} args The list of arguments to parse.
   * @returns {array} The parsed arguments list
   */
  _eval_args (args) {
    if (!isArray(args)) return args
    return args.map( el => {
      if (isArray(el)) {
        return this._eval_args(el)
      } else {
        return this._runner._syntax.remove_quotes(this._runner._syntax.eval_text(el))
      }
    })
  }

  /** Reset all item variables to their default value. */
  reset () {
    this.orig_matrix = []
    this.vars.set("cycles", 1)
    this.vars.set("repeat", 1)
    this.vars.set("skip", 0)
    this.vars.set('offset', 'no')
    this.vars.set('order', 'random')
    this.vars.set('item', '')
    this.vars.set('break_if', 'never')
    this.vars.set('source', 'table')
    this.vars.set('source_file', '')
    this._index = 0
    this._operations = []
    this._initialized = false
  }

  /**
   * Parse a definition string and retrieve all properties of the item.
   * @param {String} script - The script containing the properties of the item.
   */
  from_string (script) {
    // Creates a loop from a definition in a string.
    this.comments = []
    this.variables = {}
    this.reset()

    // Split the string into an array of lines.
    if (script != null) {
      const lines = script.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if ((lines[i] !== '') && (this.parse_variable(lines[i]) === false)) {
          const [instruction, ...params] = this.syntax.split(lines[i])

          let cycle, name, value

          switch (instruction) {
          case 'run':
            if (params.length > 0) this.vars.set('item', params[0])
            break
          case 'setcycle':
            if (params.length <= 2) {
              this._runner._debugger.addError(`Incorrect setcycle command in item ${this.name}`)
              break
            }
            cycle = params[0]
            name = params[1]
            value = this.syntax.remove_quotes(params[2])
            // Check if the value is numeric
            value = isNumber(value) ? Number(value) : value
            // If a python expression, convert to javascript.
            if (value[0] === '=') {
              // Parse the python statement.
              value = this._runner._pythonParser._prepare(value.slice(1))
              if (value !== null) {
                value = value.body[0]
              }
            }
            if (this.orig_matrix[cycle] === undefined) {
              this.orig_matrix[cycle] = {}
            }
            this.orig_matrix[cycle][name] = value
            break
          case 'fullfactorial':
            this._operations.push([fullfactorial, []])
            break
          case 'shuffle':
            this._operations.push([shuffleVert, [params]])
            break
          case 'shuffle_horiz':
            this._operations.push([shuffleHoriz, [params]])
            break
          case 'slice':
            this._operations.push([(matrix, args) => matrix.slice(...args), [params]])
            break
          case 'sort':
            this._operations.push([sortCol, [...params]])
            break
          case 'sortby':
            this._operations.push([sortBy, [params]])
            break
          case 'reverse':
            this._operations.push([reverseRows, [params]])
            break
          case 'roll':
            this._operations.push([roll, [...params]])
            break
          case 'weight':
            this._operations.push([weight, [...params]])
            break
          }
        }
      }
    }
  }

  /**
   * Prepares the variables for one single cycle within the loop.
   * @param {Number} cycle -The cycle to apply.
   */
  apply_cycle (cycle) {
    // Sets all the loop variables according to the cycle.
    if (cycle in this.matrix) {
      for (const variable in this.matrix[cycle]) {
        // Get the value of the variable.
        let value = this.matrix[cycle][variable]

        // Check for python expression.
        if (typeof value === 'object') {
          // value contains ast tree, run the parser.
          try {
            // Evaluate the expression
            value = this._runner._pythonParser._runstatement(value)
          } catch (e) {
            // Error during evaluation.
            this._runner._debugger.addError(
              'Failed to evaluate expression in in loop item: ' + this.name + ' (' + value + ')')
          }
        } else {
          // Evaluate variabels potentially available in value.
          value = this._runner._syntax.eval_text(value)
        }
        // Set the variable.
        this.experiment.vars.set(variable, value)
      }
    }
  }

  /** Implements the prepare phase of an item. */
  prepare () {
    // Make sure the item to run exists.
    const item = this.vars.get('item')
    if (this.experiment.items._items[item] === 'undefined') {
      this._runner._debugger.addError('Could not find an item which is called by loop item: ' +
      this.name + ' (' + item + ')')
    }
    if (this.vars.get('source') === 'file') this.parseFileSource()
    this._initialized = false
    super.prepare()
    this.set_item_onset()
  }
  
  /** Reads the loop table from a csv file in the file pool **/
  parseFileSource () {
    let src = this.vars.get('source_file')
    if (!src.toLowerCase().endsWith('.csv')) {
      throw 'Only csv files are supported as source files by loop items'
    }
    if (typeof this._runner._pool[src] === 'undefined') {
      throw 'Loop item refers to non-existing source file: ' + src
    }
    this.orig_matrix = parse(
      this._runner._pool[src].data,
      {columns: true, skip_empty_lines: true}
    )
  }

  /** Implements the run phase of an item. */
  run () {
    super.run()
    if (!this._initialized) {
      // The first step is to create an array of cycle indices (`cycles`). We
      // first add the integer part of the repeats to this array, which results
      // in a `cycles` array with a length that is a multiple of the original
      // matrix length.
      let cycles = []
      const wholeRepeats = Math.floor(this.vars.get('repeat'))
      for (let j = 0; j < wholeRepeats; j++) {
        for (let i in this.orig_matrix) {
          cycles.push(i)
        }
      }
      // Next, we add the non-integer part of the repeats to the cycles array.
      const partialRepeats = this.vars.get('repeat') - wholeRepeats
      const order = this.vars.get('order')
      if (partialRepeats > 0) {
        // Get an array of all cycles indices. (This syntax is like a range().)
        // For randomly ordered loops, shuffle the order of the indices.
        // This makes sure that the next step of determining the repeatcycles
        // is a 'random selection without replacement'
        let allCycles = [...Array(this.orig_matrix.length).keys()]
        if (order === 'random') {
          allCycles = shuffle(allCycles)
        }
        // Add the remaining cycles to the cycles array
        const remainder = Math.floor(this.orig_matrix.length * partialRepeats)
        cycles = [...cycles, ...allCycles.splice(0, remainder)]
      }
      if (order === 'random') {
        cycles = shuffle(cycles)
      }
      // Create a live matrix that takes into account the repeats and the
      // shuffles.
      this.matrix = []
      for (let k in cycles) {
        this.matrix.push(this.orig_matrix[cycles[k]])
      }
      // Perform the operations. This may change the number of cycles, which
      // is why this._cycles is only determined afterwards.
      this.matrix = this._operations.reduce((mtrx, [func, args]) =>
        func(mtrx, ...this._eval_args(args)), this.matrix)      
      this._cycles = [... this.matrix.keys()]
      this._initialized = true
      this._index = null
    } // end init
    // Check if if the cycle must be repeated.
    if (this.experiment.vars.get('repeat_cycle', true, -1) === 1 && this._index !== null) {
      this._runner._debugger.msg('Repeating cycle: ' + this._index)
      this._cycles.push(this._index)
      if (this.vars.get('order') === 'random') {
        this._cycles = shuffle(this._cycles)
      }
    }
    // When the loop is finished
    if (this._cycles.length == 0) {
      this._complete()
      return
    }
    // Prepare for the current cycle
    this._index = this._cycles.shift()
    this.apply_cycle(this._index)
    this.experiment.vars.set('repeat_cycle', 0)
    // Process the break-if statement
    const break_if_val = this.vars.get('break_if', false)
    this._break_if = ['never', ''].includes(break_if_val)
      ? null
      : break_if_val
    if (this._break_if !== null) {
      this.python_workspace['this'] = this
      if (this.experiment._javascriptWorkspace._eval(this._break_if)) {
        this._complete()
        this._initialized = false
        return
      }
    }
    // Execute the item to run
    const item = this.vars.get('item')
    if (this._runner._itemStore._items[item].type === 'sequence') {
      this._runner._itemStore.prepare(item, this)
    } else {
      this._runner._itemStore.execute(item, this)
    }
  }
}
