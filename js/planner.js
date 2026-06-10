/* =====================================================================
   planner.js  —  Builds the weekly plan and chooses exercises.
   ---------------------------------------------------------------------
   Rules it follows:
     * Auto split by days/week (full-body, upper/lower, or push/pull/legs)
     * Only suggests exercises whose equipment you OWN
     * Skips muscles you've marked sore
     * Leaves the remaining weekdays as rest days
   ===================================================================== */

window.WApp = window.WApp || {};

WApp.Planner = (function () {

  var DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

  /* Which focus each workout day gets, by how many days you train. */
  function splitForDays(n) {
    switch (n) {
      case 1: return ["full"];
      case 2: return ["full", "full"];
      case 3: return ["full", "full", "full"];
      case 4: return ["upper", "lower", "upper", "lower"];
      case 5: return ["push", "pull", "legs", "upper", "lower"];
      case 6: return ["push", "pull", "legs", "push", "pull", "legs"];
      default: return ["full", "full", "full"];
    }
  }

  /* Which weekday indexes (0=Mon) are training days — spaced for recovery. */
  function trainingWeekdays(n) {
    switch (n) {
      case 1: return [2];                 // Wed
      case 2: return [0, 3];              // Mon, Thu
      case 3: return [0, 2, 4];          // Mon, Wed, Fri
      case 4: return [0, 1, 3, 4];       // Mon, Tue, Thu, Fri
      case 5: return [0, 1, 2, 4, 5];    // Mon, Tue, Wed, Fri, Sat
      case 6: return [0, 1, 2, 3, 4, 5]; // Mon–Sat
      default: return [0, 2, 4];
    }
  }

  var FOCUS_LABELS = {
    full: "Full Body", upper: "Upper Body", lower: "Lower Body",
    push: "Push (Chest / Shoulders / Triceps)",
    pull: "Pull (Back / Biceps)", legs: "Legs"
  };

  /* The muscle "slots" each focus tries to fill, in order. */
  var TEMPLATES = {
    full:  [["legs","quads"],["push","chest"],["pull","back"],["legs","hamstrings"],["push","shoulders"],["core","core"]],
    upper: [["push","chest"],["pull","back"],["push","shoulders"],["pull","biceps"],["push","triceps"],["core","core"]],
    lower: [["legs","quads"],["legs","hamstrings"],["legs","glutes"],["legs","calves"],["core","core"]],
    push:  [["push","chest"],["push","chest"],["push","shoulders"],["push","shoulders"],["push","triceps"],["push","triceps"]],
    pull:  [["pull","back"],["pull","back"],["pull","biceps"],["pull","biceps"],["pull","back"],["core","core"]],
    legs:  [["legs","quads"],["legs","quads"],["legs","hamstrings"],["legs","glutes"],["legs","calves"],["core","core"]]
  };

  /* ---- helpers ---- */

  function ownedSet(state) {
    var s = {};
    (state.equipment || []).forEach(function (id) { s[id] = true; });
    s.bodyweight = true; // always available
    return s;
  }

  function canDo(ex, owned) {
    if (ex.equipment !== "bodyweight" && !owned[ex.equipment]) return false;
    if (ex.needs) {
      for (var i = 0; i < ex.needs.length; i++) {
        if (!owned[ex.needs[i]]) return false;
      }
    }
    return true;
  }

  /* Muscles currently sore (expiry still in the future). */
  function soreSet(state) {
    var now = Date.now(), out = {};
    var sore = state.soreness || {};
    for (var m in sore) { if (sore[m] > now) out[m] = true; }
    return out;
  }

  function applyGoal(ex, goal) {
    var sets = ex.sets;
    if (goal === "strength" && ex.category !== "core") sets = Math.min(ex.sets + 1, 5);
    return { exId: ex.id, sets: sets, reps: ex.reps };
  }

  /* Pick exercises for one focus, honoring equipment + soreness. */
  function pickExercises(focus, state) {
    var owned = ownedSet(state);
    var sore = soreSet(state);
    var goal = state.settings.goal;
    var template = TEMPLATES[focus] || TEMPLATES.full;
    var chosen = [];
    var usedIds = {};

    function find(cat, muscle, allowSore, mainOnly) {
      // shuffle a copy for variety between regenerations
      var pool = WApp.EXERCISES.filter(function (ex) {
        if (ex.category !== cat) return false;
        if (usedIds[ex.id]) return false;
        if (!canDo(ex, owned)) return false;
        if (!allowSore && sore[ex.muscles[0]]) return false;
        if (muscle) {
          if (mainOnly) return ex.muscles[0] === muscle;
          return ex.muscles.indexOf(muscle) !== -1;
        }
        return true;
      });
      if (!pool.length) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    template.forEach(function (slot) {
      var cat = slot[0], muscle = slot[1];
      // Try increasingly relaxed searches so a slot rarely ends up empty.
      var ex = find(cat, muscle, false, true)   // exact main muscle, not sore
            || find(cat, muscle, false, false)   // muscle anywhere, not sore
            || find(cat, null,   false, false)   // any in category, not sore
            || find(cat, muscle, true,  false)   // allow sore as last resort
            || find(cat, null,   true,  false);
      if (ex) { usedIds[ex.id] = true; chosen.push(applyGoal(ex, goal)); }
    });

    return chosen;
  }

  /* Build the whole 7-day schedule from current settings. */
  function buildSchedule(state) {
    var n = state.settings.daysPerWeek;
    var focuses = splitForDays(n);
    var trainDays = trainingWeekdays(n);
    var schedule = [];
    var workoutIndex = 0;

    for (var d = 0; d < 7; d++) {
      var isTrain = trainDays.indexOf(d) !== -1;
      if (isTrain) {
        var focus = focuses[workoutIndex] || "full";
        workoutIndex++;
        schedule.push({
          weekday: d,
          name: DAY_NAMES[d],
          type: "workout",
          focus: focus,
          label: FOCUS_LABELS[focus],
          exercises: pickExercises(focus, state)
        });
      } else {
        schedule.push({
          weekday: d,
          name: DAY_NAMES[d],
          type: "rest",
          focus: null,
          label: "Rest Day",
          exercises: []
        });
      }
    }
    return schedule;
  }

  /* Rebuild just one day's exercises (used after soreness/equipment change). */
  function regenerateDay(state, dayIndex) {
    var day = state.schedule[dayIndex];
    if (!day || day.type !== "workout") return;
    day.exercises = pickExercises(day.focus, state);
  }

  /* Make `count` workout days unavailable shift to the next free rest day. */
  function shiftWorkoutOffDay(state, dayIndex) {
    var sched = state.schedule;
    var day = sched[dayIndex];
    if (!day || day.type !== "workout") return false;
    // Find the next rest day after this one (wrapping the week).
    for (var step = 1; step < 7; step++) {
      var t = (dayIndex + step) % 7;
      if (sched[t].type === "rest") {
        // Move the workout there.
        sched[t] = {
          weekday: sched[t].weekday, name: sched[t].name,
          type: "workout", focus: day.focus, label: day.label,
          exercises: day.exercises
        };
        sched[dayIndex] = {
          weekday: day.weekday, name: day.name,
          type: "rest", focus: null, label: "Rest Day", exercises: []
        };
        return true;
      }
    }
    return false; // no rest day available to move into
  }

  return {
    DAY_NAMES: DAY_NAMES,
    FOCUS_LABELS: FOCUS_LABELS,
    buildSchedule: buildSchedule,
    regenerateDay: regenerateDay,
    shiftWorkoutOffDay: shiftWorkoutOffDay,
    pickExercises: pickExercises,
    soreSet: soreSet,
    ownedSet: ownedSet,
    canDo: canDo
  };
})();
