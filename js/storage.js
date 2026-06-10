/* =====================================================================
   storage.js  —  Reads and writes everything to the device.
   ---------------------------------------------------------------------
   All your data lives in the browser's localStorage on THIS device.
   Nothing is uploaded anywhere. Clearing your browser data, or using
   "Reset all data" in Settings, wipes it.
   ===================================================================== */

window.WApp = window.WApp || {};

WApp.Storage = (function () {
  var KEY = "workout_app_state_v1";

  /* The shape of a brand-new, untouched app. */
  function defaults() {
    return {
      onboarded: false,
      profile: {
        name: "",
        age: "",
        height: "",      // stored in the chosen unit's raw number(s)
        heightIn: "",    // inches part when using ft/in
        weight: "",
        gender: ""
      },
      settings: {
        units: "imperial",   // "imperial" (lb / ft-in) or "metric" (kg / cm)
        daysPerWeek: 3,
        goal: "general",     // general | strength | muscle
        restSeconds: 90,     // default rest timer length
        soundOn: true,
        vibrateOn: true
      },
      // Equipment ids you own. Bodyweight is always available and not listed.
      equipment: [],
      // The 7-day plan. Built by the planner. Index 0 = Monday.
      schedule: null,
      // Muscle soreness: { muscleId: expiryTimestampMs }
      soreness: {},
      // Days you've marked unavailable: { "YYYY-MM-DD": true }
      unavailable: {},
      // Completed-set tracking per date: { "YYYY-MM-DD": { exId: [true,false,...] } }
      progress: {}
    };
  }

  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      var saved = JSON.parse(raw);
      // Merge so new fields added in updates don't break old saves.
      return deepDefaults(saved, defaults());
    } catch (e) {
      console.warn("Could not load saved data, starting fresh.", e);
      return defaults();
    }
  }

  /* Fill any missing keys from defaults without clobbering saved values. */
  function deepDefaults(saved, def) {
    if (typeof def !== "object" || def === null || Array.isArray(def)) {
      return saved === undefined ? def : saved;
    }
    var out = {};
    for (var k in def) {
      out[k] = deepDefaults(saved ? saved[k] : undefined, def[k]);
    }
    // keep any extra saved keys too
    for (var sk in saved) { if (!(sk in out)) out[sk] = saved[sk]; }
    return out;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      alert("Couldn't save your data — your device storage may be full.");
    }
  }

  function reset() {
    state = defaults();
    save();
  }

  /* ---- Backup & Restore ----
     exportText(): the entire app state as a tidy text string to save in a file.
     importText(): take that string back and replace the current data with it. */

  function exportText() {
    var payload = {
      _app: "MyLift",
      _version: 1,
      _exportedAt: new Date().toISOString(),
      data: state
    };
    return JSON.stringify(payload, null, 2);
  }

  function importText(text) {
    var parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return { ok: false, error: "That doesn't look like a valid backup file." };
    }
    // Accept either a wrapped backup ({ _app, data }) or a raw state object.
    var incoming = parsed && parsed.data ? parsed.data : parsed;
    if (!incoming || typeof incoming !== "object" ||
        !("profile" in incoming) || !("settings" in incoming)) {
      return { ok: false, error: "This file isn't a MyLift backup." };
    }
    // Merge onto defaults so any missing/older fields are filled in safely.
    state = deepDefaults(incoming, defaults());
    save();
    return { ok: true };
  }

  return {
    get: function () { return state; },
    save: save,
    reset: reset,
    exportText: exportText,
    importText: importText
  };
})();
