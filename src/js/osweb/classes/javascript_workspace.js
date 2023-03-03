import JavaScriptWorkspaceAPI from '../classes/javascript_workspace_api'
import CanvasHandler from '../classes/canvas_handler'
import random from 'random-ext'
import convert from 'color-convert'
import csvParse from "csv-parse/lib/sync"
import {range, enumerate, items, zip, zipLongest} from 'pythonic'


/**
 * A proxy handler for the VarStore that maps properties onto calls to
 * VarStore.get(), so that variables are automatically evaluated, just like
 * in the OpenSesame `var` API.
 */
class VarStoreHandler {
  get (target, prop) {
    // The VarStore sets a property on itself to bypass this proxy. This
    // avoids feedback loops when the VarStore tries to get a variable without
    // evaluating it.
    if (target._bypass_proxy === true) {
      return target[prop]
    }
    return typeof target[prop] === 'string'
      ? target.get(prop, null, true, null, false)
      : target[prop]
  }
}


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
    document.body.appendChild(this._script_container)
  }
  
  _init() {
    this._script_element = document.createElement('script')
    document.__JavaScriptWorkspaceAPI = JavaScriptWorkspaceAPI
    document.__vars = new Proxy(this.experiment.vars, new VarStoreHandler())
    document.__range = range
    document.__enumerate = enumerate
    document.__items = items
    document.__zip = zip
    document.__zipLongest = zipLongest
    document.__random = random
    document.__convert = convert
    document.__csvParse = csvParse
    document.__CanvasHandler = CanvasHandler
    this._script_element.innerHTML = `
const Canvas = (styleArgs = {}) => new document.__CanvasHandler(
    runner._experiment, styleArgs)
const exp = runner._experiment
const pool = runner._pool
const vars = document.__vars
const persistent = {}
// Expose common functions. Binding is necessary to provide the correct scope
// for the functions. The JavaScriptWorkspaceAPI class is exposed as a property
// of the document object because imports are not allowed in this context.
const api = new document.__JavaScriptWorkspaceAPI(exp)
const reset_feedback = api.reset_feedback.bind(api)
const set_subject_nr = api.set_subject_nr.bind(api)
const sometimes = api.sometimes.bind(api)
const xy_from_polar = api.xy_from_polar.bind(api)
const xy_to_polar = api.xy_to_polar.bind(api)
const xy_distance = api.xy_distance.bind(api)
const xy_circle = api.xy_circle.bind(api)
const xy_grid = api.xy_grid.bind(api)
const xy_random = api.xy_random.bind(api)
// Expose other common functions that are exposed through the documens object
const range = document.__range
const enumerate = document.__enumerate
const items = document.__items
const zip = document.__zip
const zipLongest = document.__zipLongest
const random = document.__random
const convert = document.__convert
const csvParse = document.__csvParse
`
    this._script_container.appendChild(this._script_element)
  }

  /**
   * Evaluates JavaScript code in the workspace and returns the result. This is
   * for evaluating single-line expressions such as in run-if statements.
   * @param {String} js - JavaScript code to execute
   * @returns {Object} - Return value
   */
  _eval(js) {
    if (this._script_element === null) {
      this._init()
      return this._eval(js)
    }
    this._script_container.removeChild(this._script_element)
    this._script_element = document.createElement('script')
    this._script_element.innerHTML = `runner._experiment._javascriptWorkspace._result = ${js}`
    this._script_container.appendChild(this._script_element)
    return this._result
  }
  
  /**
   * Executes JavaScript code in the workspace. This is for executing longer
   * chunks of code that do not evaluate to a single value, such as 
   * inline_javascript.
   * @param {String} js - JavaScript code to execute
   */
  exec(js) {
    if (this._script_element === null) {
      this._init()
      return this.exec(js)
    }
    this._script_container.removeChild(this._script_element)
    this._script_element = document.createElement('script')
    this._script_element.innerHTML = js
    this._script_container.appendChild(this._script_element)
  }
  
  // _eval (js) {
  //   // OSWeb objects
  //   const vars = this.vars_proxy
  //   const Canvas = (styleArgs = {}) => new CanvasHandler(
  //       this.experiment, styleArgs)
  //   const pool = this.experiment.pool
  //   const persistent = this._persistent
  //   // Expose common functions. Binding is necessary to provide the correct
  //   // scope for the functions.
  //   const reset_feedback = this.api.reset_feedback.bind(this.api)
  //   const set_subject_nr = this.api.set_subject_nr.bind(this.api)
  //   const sometimes = this.api.sometimes.bind(this.api)
  //   const xy_from_polar = this.api.xy_from_polar.bind(this.api)
  //   const xy_to_polar = this.api.xy_to_polar.bind(this.api)
  //   const xy_distance = this.api.xy_distance.bind(this.api)
  //   const xy_circle = this.api.xy_circle.bind(this.api)
  //   const xy_grid = this.api.xy_grid.bind(this.api)
  //   const xy_random = this.api.xy_random.bind(this.api)
  //   // Expose useful libraries
  //   const random = randomExt
  //   const convert = colorConvert
  //   const csvParse = parse
  //   // Expose the pythonic functions
  //   const range = pyRange
  //   const zip = pyZip
  //   const zipLongest = pyZipLongest
  //   const enumerate = pyEnumerate
  //   const items = pyItems
  //   return eval(js)
  // }
}
