import CanvasHandler from '../classes/canvas_handler'
import JavaScriptWorkspaceAPI from '../classes/javascript_workspace_api'
import randomExt from 'random-ext'
import colorConvert from 'color-convert'
import parse from "csv-parse/lib/sync"
import {
    range as pyRange,
    enumerate as pyEnumerate,
    items as pyItems,
    zip as pyZip,
    zipLongest as pyZipLongest} from 'pythonic'

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
    this.vars_proxy = new Proxy(this.experiment.vars, new VarStoreHandler())
    this.api = new JavaScriptWorkspaceAPI(this.experiment)
    this._persistent = {}
  }

  /**
   * Executes JavaScript code in the workspace.
   * @param {String} js - JavaScript code to execute
   */
  _eval (js) {
    // OSWeb objects
    const vars = this.vars_proxy
    const Canvas = (styleArgs = {}) => new CanvasHandler(
        this.experiment, styleArgs)
    const pool = this.experiment.pool
    const persistent = this._persistent
    // Expose common functions. Binding is necessary to provide the correct
    // scope for the functions.
    const reset_feedback = this.api.reset_feedback.bind(this.api)
    const set_subject_nr = this.api.set_subject_nr.bind(this.api)
    const sometimes = this.api.sometimes.bind(this.api)
    const xy_from_polar = this.api.xy_from_polar.bind(this.api)
    const xy_to_polar = this.api.xy_to_polar.bind(this.api)
    const xy_distance = this.api.xy_distance.bind(this.api)
    const xy_circle = this.api.xy_circle.bind(this.api)
    const xy_grid = this.api.xy_grid.bind(this.api)
    const xy_random = this.api.xy_random.bind(this.api)
    // Expose useful libraries
    const random = randomExt
    const convert = colorConvert
    const csvParse = parse
    // Expose the pythonic functions
    const range = pyRange
    const zip = pyZip
    const zipLongest = pyZipLongest
    const enumerate = pyEnumerate
    const items = pyItems
    return eval(js)
  }
}
