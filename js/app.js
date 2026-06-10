/* =====================================================================
   app.js  —  The screens and navigation that tie everything together.
   ===================================================================== */

window.WApp = window.WApp || {};

(function () {
  var S = WApp.Storage;
  var P = WApp.Planner;
  var T = WApp.Timer;

  var root = document.getElementById("app");
  var nav = document.getElementById("nav");
  var current = "home";

  /* ---------------- small helpers ---------------- */

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function todayIndex() {           // 0 = Monday
    return (new Date().getDay() + 6) % 7;
  }

  function dateKeyForWeekday(wd) {  // calendar date of a weekday in THIS week
    var d = new Date();
    var diff = wd - todayIndex();
    d.setDate(d.getDate() + diff);
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function exById(id) {
    for (var i = 0; i < WApp.EXERCISES.length; i++) {
      if (WApp.EXERCISES[i].id === id) return WApp.EXERCISES[i];
    }
    return null;
  }

  function equipLabel(id) {
    for (var i = 0; i < WApp.EQUIPMENT.length; i++) {
      if (WApp.EQUIPMENT[i].id === id) return WApp.EQUIPMENT[i].label;
    }
    return id;
  }

  function fmtTime(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + String(s).padStart(2, "0");
  }

  /* ---------------- navigation ---------------- */

  function go(screen, param) {
    current = screen;
    T.cancel();                 // stop any running rest timer on navigation
    window.scrollTo(0, 0);
    render(screen, param);
    renderNav();
  }
  WApp.go = go;

  function renderNav() {
    var st = S.get();
    if (!st.onboarded) { nav.innerHTML = ""; return; }
    var items = [
      ["home", "Schedule", "📅"],
      ["equipment", "Equipment", "🏋️"],
      ["adjust", "Adjust", "🩹"],
      ["settings", "Settings", "⚙️"]
    ];
    nav.innerHTML = items.map(function (it) {
      var active = (current === it[0] || (current === "workout" && it[0] === "home")) ? " active" : "";
      return '<button class="nav-btn' + active + '" data-go="' + it[0] + '">' +
             '<span class="nav-ico">' + it[2] + '</span>' +
             '<span class="nav-lbl">' + it[1] + '</span></button>';
    }).join("");
    nav.querySelectorAll("[data-go]").forEach(function (b) {
      b.onclick = function () { go(b.getAttribute("data-go")); };
    });
  }

  function render(screen, param) {
    if (screen === "onboarding") return renderOnboarding();
    if (screen === "home") return renderHome();
    if (screen === "workout") return renderWorkout(param);
    if (screen === "equipment") return renderEquipment();
    if (screen === "adjust") return renderAdjust();
    if (screen === "settings") return renderSettings();
  }

  /* ===================================================================
     ONBOARDING / WELCOME
     =================================================================== */
  function renderOnboarding() {
    var st = S.get();
    var p = st.profile, s = st.settings;
    var imperial = s.units === "imperial";

    root.innerHTML =
      '<div class="screen welcome">' +
      '  <h1 class="brand">💪 MyLift</h1>' +
      '  <p class="sub">Let’s set up your plan. This stays on your device only.</p>' +

      '  <label class="fld"><span>Your name</span>' +
      '    <input id="f_name" type="text" value="' + esc(p.name) + '" placeholder="Alex"></label>' +

      '  <div class="row2">' +
      '    <label class="fld"><span>Age</span>' +
      '      <input id="f_age" type="number" min="10" max="100" value="' + esc(p.age) + '" placeholder="30"></label>' +
      '    <label class="fld"><span>Gender</span>' +
      '      <select id="f_gender">' +
            genderOptions(p.gender) +
      '      </select></label>' +
      '  </div>' +

      '  <div class="seg" id="units">' +
      '    <button data-u="imperial" class="' + (imperial ? "on" : "") + '">lb / ft·in</button>' +
      '    <button data-u="metric" class="' + (!imperial ? "on" : "") + '">kg / cm</button>' +
      '  </div>' +

      '  <div id="measures">' + measureFields(p, imperial) + '</div>' +

      '  <label class="fld"><span>Training days per week</span>' +
      '    <select id="f_days">' + daysOptions(s.daysPerWeek) + '</select></label>' +

      '  <label class="fld"><span>Main goal</span>' +
      '    <select id="f_goal">' + goalOptions(s.goal) + '</select></label>' +

      '  <button id="f_start" class="primary big">Build my plan →</button>' +
      '</div>';

    var imp = imperial;
    root.querySelectorAll("#units button").forEach(function (b) {
      b.onclick = function () {
        imp = b.getAttribute("data-u") === "imperial";
        root.querySelectorAll("#units button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        document.getElementById("measures").innerHTML = measureFields(readMeasures(imp), imp);
      };
    });

    document.getElementById("f_start").onclick = function () {
      var name = document.getElementById("f_name").value.trim();
      if (!name) { alert("Please enter your name."); return; }
      st.profile.name = name;
      st.profile.age = document.getElementById("f_age").value;
      st.profile.gender = document.getElementById("f_gender").value;
      var mm = readMeasures(imp);
      st.profile.height = mm.height;
      st.profile.heightIn = mm.heightIn;
      st.profile.weight = mm.weight;
      st.settings.units = imp ? "imperial" : "metric";
      st.settings.daysPerWeek = parseInt(document.getElementById("f_days").value, 10);
      st.settings.goal = document.getElementById("f_goal").value;
      st.schedule = P.buildSchedule(st);
      st.onboarded = true;
      S.save();
      go("home");
    };
  }

  function readMeasures(imperial) {
    var h = document.getElementById("f_height");
    var hi = document.getElementById("f_heightIn");
    var w = document.getElementById("f_weight");
    return {
      height: h ? h.value : "",
      heightIn: hi ? hi.value : "",
      weight: w ? w.value : ""
    };
  }

  function measureFields(p, imperial) {
    if (imperial) {
      return '' +
        '<div class="row2">' +
        '  <label class="fld"><span>Height</span>' +
        '    <div class="inline"><input id="f_height" type="number" min="3" max="8" value="' + esc(p.height) + '" placeholder="5"><em>ft</em>' +
        '    <input id="f_heightIn" type="number" min="0" max="11" value="' + esc(p.heightIn) + '" placeholder="10"><em>in</em></div></label>' +
        '  <label class="fld"><span>Weight</span>' +
        '    <div class="inline"><input id="f_weight" type="number" min="50" max="600" value="' + esc(p.weight) + '" placeholder="170"><em>lb</em></div></label>' +
        '</div>';
    }
    return '' +
      '<div class="row2">' +
      '  <label class="fld"><span>Height</span>' +
      '    <div class="inline"><input id="f_height" type="number" min="100" max="250" value="' + esc(p.height) + '" placeholder="178"><em>cm</em></div></label>' +
      '  <label class="fld"><span>Weight</span>' +
      '    <div class="inline"><input id="f_weight" type="number" min="30" max="300" value="' + esc(p.weight) + '" placeholder="77"><em>kg</em></div></label>' +
      '</div>';
  }

  function genderOptions(sel) {
    var opts = [["", "Select…"], ["male", "Male"], ["female", "Female"], ["other", "Other"], ["na", "Prefer not to say"]];
    return opts.map(function (o) {
      return '<option value="' + o[0] + '"' + (o[0] === sel ? " selected" : "") + '>' + o[1] + '</option>';
    }).join("");
  }
  function daysOptions(sel) {
    var out = "";
    for (var i = 2; i <= 6; i++) out += '<option value="' + i + '"' + (i === sel ? " selected" : "") + '>' + i + ' days</option>';
    return out;
  }
  function goalOptions(sel) {
    var opts = [["general", "General fitness"], ["muscle", "Build muscle"], ["strength", "Get stronger"]];
    return opts.map(function (o) {
      return '<option value="' + o[0] + '"' + (o[0] === sel ? " selected" : "") + '>' + o[1] + '</option>';
    }).join("");
  }

  /* ===================================================================
     HOME  /  WEEKLY SCHEDULE
     =================================================================== */
  function renderHome() {
    var st = S.get();
    if (!st.schedule) { st.schedule = P.buildSchedule(st); S.save(); }
    var ti = todayIndex();

    var snapshot = buildSnapshot(st);

    var cards = st.schedule.map(function (day, i) {
      var isToday = i === ti;
      var sore = (day.type === "workout") ? "" : "";
      var cls = "day-card " + (day.type === "workout" ? "is-workout" : "is-rest") + (isToday ? " today" : "");
      var right = day.type === "workout"
        ? '<span class="cnt">' + day.exercises.length + ' exercises</span>'
        : '<span class="cnt rest">Recover</span>';
      return '<button class="' + cls + '" data-day="' + i + '">' +
             '  <div class="dc-top"><span class="dc-day">' + day.name + (isToday ? ' · Today' : '') + '</span>' + right + '</div>' +
             '  <div class="dc-focus">' + esc(day.label) + '</div>' +
             '</button>';
    }).join("");

    root.innerHTML =
      '<div class="screen">' +
      '  <header class="hd"><h1>Hi ' + esc(st.profile.name || "there") + ' 👋</h1>' +
      '    <p class="sub">' + esc(weekSummary(st)) + '</p></header>' +
      snapshot +
      '  <div class="days">' + cards + '</div>' +
      '</div>';

    root.querySelectorAll("[data-day]").forEach(function (b) {
      b.onclick = function () { go("workout", parseInt(b.getAttribute("data-day"), 10)); };
    });
  }

  function weekSummary(st) {
    var w = st.schedule.filter(function (d) { return d.type === "workout"; }).length;
    return w + " training days · " + (7 - w) + " rest days this week";
  }

  function buildSnapshot(st) {
    var p = st.profile, s = st.settings;
    var bmi = computeBMI(p, s.units);
    var sore = P.soreSet(st);
    var soreNames = Object.keys(sore).map(function (m) { return WApp.MUSCLE_LABELS[m]; });
    var bits = [];
    if (p.weight) bits.push('<div class="snap"><span>Weight</span><b>' + esc(p.weight) + (s.units === "imperial" ? " lb" : " kg") + '</b></div>');
    if (bmi) bits.push('<div class="snap"><span>BMI</span><b>' + bmi + '</b></div>');
    bits.push('<div class="snap"><span>Goal</span><b>' + goalLabel(s.goal) + '</b></div>');
    var soreHtml = soreNames.length
      ? '<div class="banner sore">🩹 Resting sore: ' + soreNames.join(", ") + '</div>'
      : '';
    return '<div class="snaprow">' + bits.join("") + '</div>' + soreHtml;
  }

  function goalLabel(g) { return g === "muscle" ? "Build muscle" : g === "strength" ? "Get stronger" : "General"; }

  function computeBMI(p, units) {
    var kg, m;
    if (!p.weight) return null;
    if (units === "imperial") {
      var totalIn = (parseFloat(p.height) || 0) * 12 + (parseFloat(p.heightIn) || 0);
      if (!totalIn) return null;
      m = totalIn * 0.0254;
      kg = (parseFloat(p.weight) || 0) * 0.453592;
    } else {
      if (!p.height) return null;
      m = (parseFloat(p.height) || 0) / 100;
      kg = parseFloat(p.weight) || 0;
    }
    if (!m || !kg) return null;
    return (kg / (m * m)).toFixed(1);
  }

  /* ===================================================================
     WORKOUT DAY  (exercises + rest timer)
     =================================================================== */
  var timerState = { active: false };

  function renderWorkout(dayIndex) {
    var st = S.get();
    var day = st.schedule[dayIndex];
    if (!day) { go("home"); return; }

    if (day.type === "rest") {
      root.innerHTML =
        '<div class="screen">' +
        backBtn() +
        '  <header class="hd"><h1>' + day.name + '</h1><p class="sub">Rest day — let your body rebuild.</p></header>' +
        '  <div class="rest-illo">😴</div>' +
        '  <p class="center muted">No workout scheduled. Feeling great and want to train anyway? You can mark another day unavailable in <b>Adjust</b>, or add equipment to refresh your plan.</p>' +
        '</div>';
      return;
    }

    var dateKey = dateKeyForWeekday(day.weekday);
    var prog = (st.progress[dateKey] = st.progress[dateKey] || {});

    var list = day.exercises.map(function (item, idx) {
      var ex = exById(item.exId);
      if (!ex) return "";
      var done = prog[item.exId] || [];
      var sets = "";
      for (var s = 0; s < item.sets; s++) {
        sets += '<button class="set-dot' + (done[s] ? " done" : "") + '" data-ex="' + item.exId + '" data-set="' + s + '" data-date="' + dateKey + '">' + (s + 1) + '</button>';
      }
      var muscles = ex.muscles.map(function (m) { return WApp.MUSCLE_LABELS[m]; }).join(" · ");
      return '<div class="ex-card">' +
             '  <div class="ex-top"><div><div class="ex-name">' + esc(ex.name) + '</div>' +
             '    <div class="ex-meta">' + esc(muscles) + ' · ' + equipLabel(ex.equipment === "bodyweight" ? "bodyweight" : ex.equipment) + '</div></div>' +
             '    <div class="ex-rx">' + item.sets + ' × ' + esc(ex.reps) + '</div></div>' +
             '  <div class="ex-note">' + esc(ex.note) + '</div>' +
             '  <div class="sets">' + sets + '<button class="rest-link" data-rest="1">⏱ Rest</button></div>' +
             '</div>';
    }).join("");

    root.innerHTML =
      '<div class="screen has-timer">' +
      backBtn() +
      '  <header class="hd"><h1>' + day.name + '</h1><p class="sub">' + esc(day.label) + '</p></header>' +
      '  <div class="ex-list">' + (list || '<p class="muted center">No exercises fit your current equipment. Add gear in <b>Equipment</b>.</p>') + '</div>' +
      '  <button id="regen" class="ghost">🔄 Shuffle exercises</button>' +
      timerPanelHtml(st) +
      '</div>';

    // set-completion dots
    root.querySelectorAll(".set-dot").forEach(function (b) {
      b.onclick = function () {
        var exId = b.getAttribute("data-ex");
        var setN = parseInt(b.getAttribute("data-set"), 10);
        var dk = b.getAttribute("data-date");
        var pr = S.get().progress[dk] = S.get().progress[dk] || {};
        pr[exId] = pr[exId] || [];
        pr[exId][setN] = !pr[exId][setN];
        S.save();
        b.classList.toggle("done");
        // auto-start rest when a set is marked done
        if (pr[exId][setN]) startTimer(S.get().settings.restSeconds);
      };
    });

    // per-exercise quick rest
    root.querySelectorAll('[data-rest]').forEach(function (b) {
      b.onclick = function () { startTimer(S.get().settings.restSeconds); };
    });

    document.getElementById("regen").onclick = function () {
      P.regenerateDay(S.get(), dayIndex);
      S.save();
      renderWorkout(dayIndex);
    };

    wireTimerPanel();
  }

  function timerPanelHtml(st) {
    var def = st.settings.restSeconds;
    return '' +
      '<div class="timer-bar" id="timerbar">' +
      '  <div class="t-display" id="t_disp">' + fmtTime(def) + '</div>' +
      '  <div class="t-ring"><div class="t-fill" id="t_fill"></div></div>' +
      '  <div class="t-row">' +
      '    <button class="t-chip" data-set-rest="60">60s</button>' +
      '    <button class="t-chip" data-set-rest="90">90s</button>' +
      '    <button class="t-chip" data-set-rest="120">2:00</button>' +
      '    <button class="t-chip" data-set-rest="180">3:00</button>' +
      '  </div>' +
      '  <div class="t-row">' +
      '    <button class="t-btn" id="t_minus">−15</button>' +
      '    <button class="t-btn primary" id="t_toggle">Start</button>' +
      '    <button class="t-btn" id="t_plus">+15</button>' +
      '    <button class="t-btn" id="t_reset">Reset</button>' +
      '  </div>' +
      '</div>';
  }

  function setTimerDisplay(remaining, total) {
    var disp = document.getElementById("t_disp");
    var fill = document.getElementById("t_fill");
    if (disp) disp.textContent = fmtTime(remaining);
    if (fill) {
      var pct = total > 0 ? (remaining / total) * 100 : 0;
      fill.style.width = pct + "%";
      fill.style.background = remaining <= 5 ? "var(--warn)" : "var(--accent)";
    }
    var toggle = document.getElementById("t_toggle");
    if (toggle) toggle.textContent = T.isRunning() ? "Pause" : (remaining > 0 && remaining < (T.getTotal() || 1) ? "Resume" : "Start");
    var bar = document.getElementById("timerbar");
    if (bar) bar.classList.toggle("ringing", remaining === 0);
  }

  function startTimer(seconds) {
    T.start(seconds, setTimerDisplay, function () {
      var bar = document.getElementById("timerbar");
      if (bar) {
        bar.classList.add("flash");
        setTimeout(function () { bar.classList.remove("flash"); }, 1500);
      }
    });
  }

  function wireTimerPanel() {
    var st = S.get();
    setTimerDisplay(st.settings.restSeconds, st.settings.restSeconds);
    T.reset(st.settings.restSeconds);

    root.querySelectorAll("[data-set-rest]").forEach(function (b) {
      b.onclick = function () { startTimer(parseInt(b.getAttribute("data-set-rest"), 10)); };
    });
    document.getElementById("t_toggle").onclick = function () {
      if (T.isRunning()) { T.pause(); }
      else if (T.getRemaining() > 0 && T.getRemaining() < T.getTotal()) { T.resume(); }
      else { startTimer(T.getTotal() || st.settings.restSeconds); }
    };
    document.getElementById("t_plus").onclick = function () { T.addTime(15); };
    document.getElementById("t_minus").onclick = function () { T.addTime(-15); };
    document.getElementById("t_reset").onclick = function () { T.reset(); setTimerDisplay(T.getRemaining(), T.getTotal()); };
  }

  function backBtn() {
    return '<button class="back" onclick="WApp.go(\'home\')">← Schedule</button>';
  }

  /* ===================================================================
     EQUIPMENT  (search + own/remove)
     =================================================================== */
  function renderEquipment() {
    var st = S.get();
    root.innerHTML =
      '<div class="screen">' +
      '  <header class="hd"><h1>Equipment</h1><p class="sub">Search and tick what you have. Your plan only uses gear you own (bodyweight is always on).</p></header>' +
      '  <input id="eq_search" class="search" type="text" placeholder="🔍 Search equipment…">' +
      '  <div class="owned-count" id="eq_count"></div>' +
      '  <div id="eq_list" class="eq-list"></div>' +
      '</div>';

    var search = document.getElementById("eq_search");
    function draw() {
      var q = search.value.trim().toLowerCase();
      var owned = {};
      S.get().equipment.forEach(function (id) { owned[id] = true; });
      var list = WApp.EQUIPMENT.filter(function (e) {
        return !q || e.label.toLowerCase().indexOf(q) !== -1;
      });
      document.getElementById("eq_count").textContent =
        S.get().equipment.length + " of " + WApp.EQUIPMENT.length + " items owned";
      document.getElementById("eq_list").innerHTML = list.map(function (e) {
        var on = owned[e.id];
        return '<button class="eq-item' + (on ? " owned" : "") + '" data-eq="' + e.id + '">' +
               '<span>' + esc(e.label) + '</span>' +
               '<span class="eq-check">' + (on ? "✓ Owned" : "+ Add") + '</span></button>';
      }).join("") || '<p class="muted center">No equipment matches “' + esc(q) + '”.</p>';

      document.getElementById("eq_list").querySelectorAll("[data-eq]").forEach(function (b) {
        b.onclick = function () { toggleEquip(b.getAttribute("data-eq")); draw(); };
      });
    }

    function toggleEquip(id) {
      var s = S.get();
      var i = s.equipment.indexOf(id);
      if (i === -1) s.equipment.push(id);
      else s.equipment.splice(i, 1);
      // Equipment changed -> refresh every workout day to match.
      s.schedule.forEach(function (d, idx) {
        if (d.type === "workout") P.regenerateDay(s, idx);
      });
      S.save();
    }

    search.oninput = draw;
    draw();
  }

  /* ===================================================================
     ADJUST  (soreness + availability)
     =================================================================== */
  function renderAdjust() {
    var st = S.get();
    var sore = P.soreSet(st);

    var muscleChips = WApp.MUSCLES.map(function (m) {
      var on = !!sore[m];
      return '<button class="chip' + (on ? " on" : "") + '" data-sore="' + m + '">' +
             WApp.MUSCLE_LABELS[m] + (on ? " ✓" : "") + '</button>';
    }).join("");

    var dayToggles = st.schedule.map(function (d, i) {
      var cls = d.type === "workout" ? "av-day workout" : "av-day rest";
      var action = d.type === "workout"
        ? '<button class="mini" data-off="' + i + '">Mark unavailable →</button>'
        : '<span class="mini muted">rest</span>';
      return '<div class="' + cls + '"><span>' + d.name + ' · ' + esc(d.label) + '</span>' + action + '</div>';
    }).join("");

    root.innerHTML =
      '<div class="screen">' +
      '  <header class="hd"><h1>Adjust</h1><p class="sub">Tweak today’s plan around how you feel and your availability.</p></header>' +

      '  <section class="block">' +
      '    <h2>Muscle soreness</h2>' +
      '    <p class="muted">Tap any sore muscle. Workouts will avoid it for ~2 days, swapping in other moves.</p>' +
      '    <div class="chips">' + muscleChips + '</div>' +
      '  </section>' +

      '  <section class="block">' +
      '    <h2>Day availability</h2>' +
      '    <p class="muted">Can’t train on a workout day? Move it to your next rest day.</p>' +
      '    <div class="av-list">' + dayToggles + '</div>' +
      '    <button id="rebuild" class="ghost">↺ Rebuild the whole week from scratch</button>' +
      '  </section>' +
      '</div>';

    root.querySelectorAll("[data-sore]").forEach(function (b) {
      b.onclick = function () {
        var m = b.getAttribute("data-sore");
        var s = S.get();
        if (s.soreness[m] && s.soreness[m] > Date.now()) {
          delete s.soreness[m];                       // un-mark
        } else {
          s.soreness[m] = Date.now() + 2 * 24 * 3600 * 1000; // sore for 2 days
        }
        // refresh workout days so sore muscles drop out now
        s.schedule.forEach(function (d, idx) {
          if (d.type === "workout") P.regenerateDay(s, idx);
        });
        S.save();
        renderAdjust();
      };
    });

    root.querySelectorAll("[data-off]").forEach(function (b) {
      b.onclick = function () {
        var i = parseInt(b.getAttribute("data-off"), 10);
        var moved = P.shiftWorkoutOffDay(S.get(), i);
        if (!moved) { alert("No rest day available this week to move that workout into."); return; }
        S.save();
        renderAdjust();
      };
    });

    document.getElementById("rebuild").onclick = function () {
      if (!confirm("Rebuild your whole week? This re-rolls every day’s exercises.")) return;
      var s = S.get();
      s.schedule = P.buildSchedule(s);
      S.save();
      renderAdjust();
    };
  }

  /* ===================================================================
     SETTINGS
     =================================================================== */
  function renderSettings() {
    var st = S.get();
    var p = st.profile, s = st.settings;
    var imperial = s.units === "imperial";

    root.innerHTML =
      '<div class="screen">' +
      '  <header class="hd"><h1>Settings</h1></header>' +

      '  <section class="block">' +
      '    <h2>Your details</h2>' +
      '    <label class="fld"><span>Name</span><input id="s_name" type="text" value="' + esc(p.name) + '"></label>' +
      '    <div class="row2">' +
      '      <label class="fld"><span>Age</span><input id="s_age" type="number" value="' + esc(p.age) + '"></label>' +
      '      <label class="fld"><span>Gender</span><select id="s_gender">' + genderOptions(p.gender) + '</select></label>' +
      '    </div>' +
      '    <div class="seg" id="s_units">' +
      '      <button data-u="imperial" class="' + (imperial ? "on" : "") + '">lb / ft·in</button>' +
      '      <button data-u="metric" class="' + (!imperial ? "on" : "") + '">kg / cm</button>' +
      '    </div>' +
      '    <div id="s_measures">' + measureFields(p, imperial) + '</div>' +
      '  </section>' +

      '  <section class="block">' +
      '    <h2>Plan</h2>' +
      '    <label class="fld"><span>Training days per week</span><select id="s_days">' + daysOptions(s.daysPerWeek) + '</select></label>' +
      '    <label class="fld"><span>Goal</span><select id="s_goal">' + goalOptions(s.goal) + '</select></label>' +
      '    <p class="muted">Changing days or goal will rebuild your weekly plan.</p>' +
      '  </section>' +

      '  <section class="block">' +
      '    <h2>Rest timer</h2>' +
      '    <label class="fld"><span>Default rest (seconds)</span><input id="s_rest" type="number" min="10" max="600" step="5" value="' + s.restSeconds + '"></label>' +
      '    <label class="toggle"><input id="s_sound" type="checkbox"' + (s.soundOn ? " checked" : "") + '> Beep when rest ends</label>' +
      '    <label class="toggle"><input id="s_vibrate" type="checkbox"' + (s.vibrateOn ? " checked" : "") + '> Vibrate when rest ends</label>' +
      '  </section>' +

      '  <section class="block">' +
      '    <h2>Backup &amp; restore</h2>' +
      '    <p class="muted">Your data lives only on this device. Save a backup file so you can restore it if you clear your browser, switch phones, or reinstall.</p>' +
      '    <button id="s_export" class="ghost" style="margin-top:0">⬇️ Save a backup file</button>' +
      '    <button id="s_import" class="ghost">⬆️ Restore from a backup file</button>' +
      '    <input id="s_import_file" type="file" accept="application/json,.json" style="display:none">' +
      '    <details class="backup-text"><summary>Or use a backup code (copy/paste)</summary>' +
      '      <p class="muted tiny">Handy if saving files is awkward on your phone — copy this text somewhere safe (a note, an email to yourself).</p>' +
      '      <textarea id="s_backup_text" rows="5" readonly></textarea>' +
      '      <div class="row2">' +
      '        <button id="s_copy" class="ghost" style="margin-top:0">📋 Copy code</button>' +
      '        <button id="s_paste" class="ghost" style="margin-top:0">↩️ Restore from code</button>' +
      '      </div>' +
      '    </details>' +
      '  </section>' +

      '  <button id="s_save" class="primary big">Save changes</button>' +
      '  <button id="s_reset" class="danger">Reset all data</button>' +
      '  <p class="muted center tiny">Everything is stored only on this device.</p>' +
      '</div>';

    var imp = imperial;
    root.querySelectorAll("#s_units button").forEach(function (b) {
      b.onclick = function () {
        imp = b.getAttribute("data-u") === "imperial";
        root.querySelectorAll("#s_units button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        document.getElementById("s_measures").innerHTML = measureFields(readMeasures(imp), imp);
      };
    });

    document.getElementById("s_save").onclick = function () {
      var s2 = S.get();
      var oldDays = s2.settings.daysPerWeek, oldGoal = s2.settings.goal;
      s2.profile.name = document.getElementById("s_name").value.trim() || s2.profile.name;
      s2.profile.age = document.getElementById("s_age").value;
      s2.profile.gender = document.getElementById("s_gender").value;
      var mm = readMeasures(imp);
      s2.profile.height = mm.height;
      s2.profile.heightIn = mm.heightIn;
      s2.profile.weight = mm.weight;
      s2.settings.units = imp ? "imperial" : "metric";
      s2.settings.daysPerWeek = parseInt(document.getElementById("s_days").value, 10);
      s2.settings.goal = document.getElementById("s_goal").value;
      s2.settings.restSeconds = Math.max(10, parseInt(document.getElementById("s_rest").value, 10) || 90);
      s2.settings.soundOn = document.getElementById("s_sound").checked;
      s2.settings.vibrateOn = document.getElementById("s_vibrate").checked;
      if (s2.settings.daysPerWeek !== oldDays || s2.settings.goal !== oldGoal) {
        s2.schedule = P.buildSchedule(s2);
      }
      S.save();
      alert("Saved!");
      go("home");
    };

    // ---- Backup & restore wiring ----
    var backupText = document.getElementById("s_backup_text");
    backupText.value = S.exportText();

    document.getElementById("s_export").onclick = function () {
      var name = (S.get().profile.name || "mylift").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      var stamp = new Date().toISOString().slice(0, 10);
      downloadFile(name + "-backup-" + stamp + ".json", S.exportText());
    };

    document.getElementById("s_import").onclick = function () {
      document.getElementById("s_import_file").click();
    };
    document.getElementById("s_import_file").onchange = function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { applyRestore(reader.result); };
      reader.onerror = function () { alert("Couldn't read that file."); };
      reader.readAsText(file);
    };

    document.getElementById("s_copy").onclick = function () {
      var ok = copyText(backupText.value);
      alert(ok ? "Backup code copied. Paste it somewhere safe!" : "Couldn't copy automatically — tap and hold the text box to copy it manually.");
    };
    document.getElementById("s_paste").onclick = function () {
      var pasted = prompt("Paste your backup code here to restore:");
      if (pasted) applyRestore(pasted);
    };

    document.getElementById("s_reset").onclick = function () {
      if (!confirm("Erase ALL data and start over? This cannot be undone.")) return;
      S.reset();
      go("onboarding");
    };
  }

  /* Confirm, restore, and bounce to the home screen. */
  function applyRestore(text) {
    if (!confirm("Restore this backup? It will replace the data currently on this device.")) return;
    var res = S.importText(text);
    if (!res.ok) { alert(res.error || "Restore failed."); return; }
    alert("Restored! Welcome back.");
    go("home");
  }

  /* Trigger a file download in the browser (works as 'share/save' on phones). */
  function downloadFile(filename, text) {
    try {
      var blob = new Blob([text], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
    } catch (e) {
      alert("Couldn't create the file on this browser — use the backup code option instead.");
    }
  }

  /* Copy text to the clipboard, with a fallback for older mobile browsers. */
  function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {}
    try {
      var ta = document.getElementById("s_backup_text");
      ta.removeAttribute("readonly");
      ta.select(); ta.setSelectionRange(0, 999999);
      var ok = document.execCommand("copy");
      ta.setAttribute("readonly", "readonly");
      return ok;
    } catch (e) { return false; }
  }

  /* ---------------- boot ---------------- */
  function boot() {
    var st = S.get();
    if (!st.onboarded) go("onboarding");
    else go("home");
  }

  // register the service worker (offline support) only when hosted
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("service-worker.js").catch(function () {});
  }

  boot();
})();
