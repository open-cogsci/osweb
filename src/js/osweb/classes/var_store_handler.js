/**
 * A proxy handler for the VarStore that maps properties onto calls to
 * VarStore.get() and VarStore.set().
 */
export default class VarStoreHandler {
  get (target, prop) {
    return target.get(prop, false, null)
  }
  set (target, key, value) {
    target.set(key, value)
  }
}
