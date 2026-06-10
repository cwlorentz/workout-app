/* =====================================================================
   timer.js  —  The rest timer you tap between exercises.
   ---------------------------------------------------------------------
   One shared timer object the workout screen drives. It counts down,
   can be paused/resumed/reset, and beeps + vibrates at zero.
   ===================================================================== */

window.WApp = window.WApp || {};

WApp.Timer = (function () {
  var total = 0;        // seconds the timer was set to
  var remaining = 0;    // seconds left
  var handle = null;    // setInterval id
  var running = false;
  var onTick = null;    // callback(remaining, total)
  var onDone = null;    // callback()

  function tick() {
    remaining -= 1;
    if (remaining <= 0) {
      remaining = 0;
      stopInterval();
      running = false;
      alertDone();
      if (onTick) onTick(remaining, total);
      if (onDone) onDone();
      return;
    }
    if (onTick) onTick(remaining, total);
  }

  function stopInterval() {
    if (handle) { clearInterval(handle); handle = null; }
  }

  function start(seconds, tickCb, doneCb) {
    stopInterval();
    total = seconds;
    remaining = seconds;
    onTick = tickCb;
    onDone = doneCb;
    running = true;
    if (onTick) onTick(remaining, total);
    handle = setInterval(tick, 1000);
  }

  function pause() {
    if (!running) return;
    stopInterval();
    running = false;
    if (onTick) onTick(remaining, total);
  }

  function resume() {
    if (running || remaining <= 0) return;
    running = true;
    handle = setInterval(tick, 1000);
    if (onTick) onTick(remaining, total);
  }

  function reset(seconds) {
    stopInterval();
    running = false;
    total = seconds != null ? seconds : total;
    remaining = total;
    if (onTick) onTick(remaining, total);
  }

  function addTime(seconds) {
    remaining = Math.max(0, remaining + seconds);
    total = Math.max(total, remaining);
    if (onTick) onTick(remaining, total);
  }

  function cancel() {
    stopInterval();
    running = false;
    remaining = 0;
  }

  /* ---- beep + vibrate when the rest is over ---- */
  function alertDone() {
    var s = WApp.Storage.get().settings;
    if (s.vibrateOn && navigator.vibrate) {
      try { navigator.vibrate([200, 100, 200]); } catch (e) {}
    }
    if (s.soundOn) beep();
  }

  function beep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      var pattern = [880, 1175]; // two ascending tones
      pattern.forEach(function (freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain); gain.connect(ctx.destination);
        var t0 = ctx.currentTime + i * 0.22;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
        osc.start(t0); osc.stop(t0 + 0.22);
      });
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 800);
    } catch (e) { /* audio not allowed yet — ignore */ }
  }

  return {
    start: start, pause: pause, resume: resume,
    reset: reset, addTime: addTime, cancel: cancel,
    isRunning: function () { return running; },
    getRemaining: function () { return remaining; },
    getTotal: function () { return total; }
  };
})();
