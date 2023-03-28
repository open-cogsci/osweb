import JavaScriptWorkspaceAPI from '../classes/javascript_workspace_api'
import CanvasHandler from '../classes/canvas_handler'
import VarStoreHandler from '../classes/var_store_handler'
import random from 'random-ext'
import convert from 'color-convert'
import csvParse from "csv-parse/lib/sync"
import {range, enumerate, items, zip, zipLongest} from 'pythonic'


/**
 * A workspace for executing inline JavaScript code. For now, the workspace is
 * not persistent, and only exposes the vars object.
 */
export default class JavaScriptWorkspace {
  /**
   * Create a JavaScript workspace.
   * @param {Object} experiment - The experiment item to which the item belongs.
   */
  constructor (experiment) {
    this.experiment = experiment
    this._script_container = document.createElement('script')
    this._script_element = null
    this._initialized = false
    document.body.appendChild(this._script_container)
  }
  
  /**
   * Initiales the workspace by making a number of functions, objects, and
   * classes available. The window object serves as the scope for the 
   * workspace.
   */
  _init() {
    this._initialized = true
    window.vars = new Proxy(this.experiment.vars, new VarStoreHandler())
    window.range = range
    window.enumerate = enumerate
    window.items = items
    window.zip = zip
    window.zipLongest = zipLongest
    window.random = random
    window.convert = convert
    window.csvParse = csvParse
    window.Canvas = (styleArgs = {}) => 
                     new CanvasHandler(runner._experiment, styleArgs)
    window.exp = runner._experiment
    window.pool = runner._pool
    window.persistent = {}
    const api = new JavaScriptWorkspaceAPI(runner._experiment)
    window.reset_feedback = api.reset_feedback.bind(api)
    window.set_subject_nr = api.set_subject_nr.bind(api)
    window.sometimes = api.sometimes.bind(api)
    window.xy_from_polar = api.xy_from_polar.bind(api)
    window.xy_to_polar = api.xy_to_polar.bind(api)
    window.xy_distance = api.xy_distance.bind(api)
    window.xy_circle = api.xy_circle.bind(api)
    window.xy_grid = api.xy_grid.bind(api)
    window.xy_random = api.xy_random.bind(api)
    window._workspace = this
  }

  /**
   * Evaluates JavaScript code in the workspace and returns the result. This is
   * for evaluating single-line expressions such as in run-if statements.
   * @param {String} js - JavaScript code to execute
   * @returns {Object} - Return value
   */
  _eval(js) {
    if (!this._initialized) {
      this._init()
      return this._eval(js)
    }
    if (this._script_element !== null)
      this._script_container.removeChild(this._script_element)
    this.current_script = js
    this._script_element = document.createElement('script')
    this._script_element.innerHTML = `_workspace._result = ${js}`
    this._script_container.appendChild(this._script_element)
    this.current_script = null
    return this._result
  }
  
  /**
   * Executes JavaScript code in the workspace. This is for executing longer
   * chunks of code that do not evaluate to a single value, such as 
   * inline_javascript.
   * @param {String} js - JavaScript code to execute
   */
  exec(js) {
    if (!this._initialized) {
      this._init()
      return this.exec(js)
    }
    if (this._script_element !== null)
      this._script_container.removeChild(this._script_element)
    this.current_script = js
    this._script_element = document.createElement('script')
    this._script_element.innerHTML = js
    this._script_container.appendChild(this._script_element)
    this.current_script = null
  }
}
