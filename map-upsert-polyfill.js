// map-upsert-polyfill.js — pdf.js 6.x calls Map/WeakMap.prototype.getOrInsertComputed
// (TC39 "upsert"). Chrome/Edge < 145, Firefox < 144 and Safari < 26.2 lack it, and the
// PDF read fails with "getOrInsertComputed is not a function". Imported before pdf.js
// in file-intake-worker.js. Native methods are never replaced.
(function () {
  function canBeHeldWeakly(k) {
    if ((typeof k === "object" && k !== null) || typeof k === "function") return true;
    return typeof k === "symbol" && Symbol.keyFor(k) === undefined;
  }
  function define(proto, name, fn) {
    if (typeof proto[name] === "function") return;
    Object.defineProperty(proto, name, { value: fn, writable: true, configurable: true, enumerable: false });
  }
  function install(C, weak) {
    var proto = C.prototype;
    var has = proto.has, get = proto.get, set = proto.set;
    function prepare(map, key) {
      // Throws TypeError on a non-Map/WeakMap receiver, as the built-in would.
      has.call(map, key);
      if (weak) {
        if (!canBeHeldWeakly(key)) throw new TypeError("Invalid value used as weak map key");
        return key;
      }
      return key === 0 ? 0 : key; // canonicalize -0 to +0
    }
    define(proto, "getOrInsert", function getOrInsert(key, value) {
      key = prepare(this, key);
      if (has.call(this, key)) return get.call(this, key);
      set.call(this, key, value);
      return value;
    });
    define(proto, "getOrInsertComputed", function getOrInsertComputed(key, callbackfn) {
      if (typeof callbackfn !== "function") throw new TypeError("callbackfn is not a function");
      key = prepare(this, key);
      if (has.call(this, key)) return get.call(this, key);
      var value = callbackfn(key);
      set.call(this, key, value);
      return value;
    });
  }
  install(Map, false);
  install(WeakMap, true);
})();
