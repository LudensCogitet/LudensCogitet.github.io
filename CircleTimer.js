// Simple function to convert an angle from degrees to radians.
function toRadians(angle) {
  return angle * (Math.PI / 180);
}

// Constructor for a single circle representing some period of time.
// If passed multiple time periods (i.e. if 'timeInSeconds' is an array of numbers), the circle will switch to representing the next period after finishing the current one.
// 'color' and 'sound' can also be arrays. The values of 'color' and 'sound' beyond index 0 will only be used if timeInSeconds is also an array.
function circleTimer(radius, color, thickness, timeInSeconds, sound = "mute", drawBack = true, counterClock = false) {
  this.radius = radius;
  this.thickness = thickness;

  this.switchSound = null;
  this.switchColor = null;
  this.switchTime = null;

  if (Array.isArray(sound)) {
    var currentSound = 0;
    this.sound = sound[0];

    this.switchSound = function() {
      currentSound++;
      if (currentSound > sound.length - 1)
        currentSound = 0;

      this.sound = sound[currentSound];
      console.log(currentSound);
    }
  } else
    this.sound = sound;

  if (Array.isArray(color)) {
    var currentColor = 0;

    this.color = color[0];

    this.switchColor = function() {
      currentColor++;
      if (currentColor > color.length - 1)
        currentColor = 0;

      this.color = color[currentColor];
    }
  } else {
    this.color = color;
  }

  if (Array.isArray(timeInSeconds)) {
    var currentTime = 0;
    this.time = timeInSeconds[0] * 1000;

    this.switchTime = function() {
      currentTime++;
      if (currentTime > timeInSeconds.length - 1)
        currentTime = 0;

      console.log(timeInSeconds[currentTime]);

      this.time = timeInSeconds[currentTime] * 1000;
      if (this.switchColor != null)
        this.switchColor();
      if (this.switchSound != null)
        this.switchSound();
    }
  } else {
    this.time = timeInSeconds * 1000;
  }

  this.target = 0;
  this.angle = 0;
  this.backMoves = drawBack;
  this.counterClock = counterClock;
}

// Global variables

/// These are the time periods represented by the inner circle. These are modified by the on-screen buttons and displayed on screen
var restPeriod = 5;
var workPeriod = 25;
// Flag indicating whether they timer is currently running.
var running = false;

// For storing the canvas element and the drawing context.
var canvas;
var context;

// These are assigned functions declared within startTimer.
var pauseTimer;
var restartTimer;

// Used to store the return value of setTimeout().
var timeout = null;
// Assigned the value of Date.now() when the timer is paused.
var timePaused = 0;
// This flag indicates whether hitting the reset button will reset the timer to current period values, or to initial values (rest = 5, work = 25).
// False = reset to current period values.
// True = reset to initial values.
var stageTwoReset = false;

// Draws three complete circles that exactly match the three timers. Used as an initial visual.
function drawInit() {
  window.requestAnimationFrame(function() {

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    context.strokeStyle = "blue";
    context.lineWidth = 3;
    context.arc(canvas.width / 2, canvas.height / 2, 150, 0, toRadians(360));
    context.stroke();
    context.closePath();
    context.beginPath();
    context.strokeStyle = "rgb(189,61,244)";
    context.lineWidth = 8;
    context.arc(canvas.width / 2, canvas.height / 2, 100, 0, toRadians(360));
    context.stroke();
    context.closePath();
    context.beginPath();
    context.strokeStyle = "#3df449";
    context.lineWidth = 12;
    context.arc(canvas.width / 2, canvas.height / 2, 50, 0, toRadians(360));
    context.stroke();
    context.closePath();
  });
}

// This (and init()), are where the magic happens.
// startTimer() acts largely as a closure for loop().
// loop() is called using setTimeout() and actually updates the display based on how close the timers are to reaching their targets.
// It also loops the timers (or starts their next periods) when they reach those targets.
function startTimer() {
  if (timeout != null) {
    clearTimeout(timeout);
  }

  var timers = [new circleTimer(150, "blue", 3, 1), new circleTimer(100, "rgb(189,61,244)", 8, 60),
    new circleTimer(50, ["#3df449", "#3ddff4"], 12, [workPeriod * 60, restPeriod * 60], [new Audio("https://cdn.rawgit.com/LudensCogitet/Files/master/348279__giomilko__bell-2.wav"), new Audio("https://cdn.rawgit.com/LudensCogitet/Files/master/348280__giomilko__bell-1.wav")])
  ];

  function loop() {
    var now = Date.now();
    for (var i = 0; i < timers.length; i++) {
      if (timers[i].counterClock == false)
        timers[i].angle = -(360 / timers[i].time) * (timers[i].target - now);
      else
        timers[i].angle = (360 / timers[i].time) * (timers[i].target - now);
    }
    window.requestAnimationFrame(function() {

      context.clearRect(0, 0, canvas.width, canvas.height);

      for (i = 0; i < timers.length; i++) {
        context.beginPath();
        context.strokeStyle = timers[i].color;
        context.lineWidth = timers[i].thickness;

        if (timers[i].backMoves == false) {
          context.arc(canvas.width / 2, canvas.height / 2, timers[i].radius, toRadians(270), toRadians(timers[i].angle + 270));
        } else {
          context.arc(canvas.width / 2, canvas.height / 2, timers[i].radius, toRadians(timers[i].angle + 270), toRadians(270));
        }
        context.stroke();
        context.closePath();
      }
    });

    for (i = 0; i < timers.length; i++) {

      if (timers[i].target - now <= 0) {
        if (timers[i].sound != "mute")
          timers[i].sound.play();

        if (timers[i].switchTime != null)
          timers[i].switchTime();

        if (timers[i].counterClock == false)
          timers[i].angle = 0.0001;
        else
          timers[i].angle = -0.0001;

        timers[i].target += timers[i].time;
        if (timers[i].backMoves == true)
          timers[i].backMoves = false;
        else
          timers[i].backMoves = true;
      }
    }
    timeout = setTimeout(loop, 1);
  }

  pauseTimer = function() {
    clearTimeout(timeout);
    timePaused = Date.now();
  }

  restartTimer = function() {
    var now = Date.now();
    for (i = 0; i < timers.length; i++) {
      timers[i].target += now - timePaused;
    }
    loop();
  }

  var now = Date.now();
  for (i = 0; i < timers.length; i++) {
    timers[i].target = now + timers[i].time;
  }
  loop();
}

// Add all the handlers necessary to set, start, pause, and reset the timers.
function init() {
  $("#help").hover(function() {
      $(this).html("&#8226 Click inside the circles to start or pause the timer.<br>&#8226 Work and rest periods are measured in minutes.<br>&#8226; Adjust the length of the work and rest periods with the '+' and '-' buttons.<br>&#8226; Changing period lengths resets the timer.");
    },
    function() {
      $(this).html("?");
    });

  $("#canvas").click(function() {
    if (running == false) {
      if (timePaused == 0) {
        startTimer();
      } else {
        restartTimer();
      }

      stageTwoReset = false;

      $(".fadeOut").animate({
        opacity: "0"
      }, 500, "linear", function() {
        $(".fadeOut").css("display", "none");
      });
      running = true;
    } else {
      pauseTimer();
      $(".fadeOut").css("display", "inline-block");
      $(".fadeOut").animate({
        opacity: "1"
      }, 1000, "linear");
      running = false;
    }

  });

  $(".active").click(function() {
    if (this.id != "reset")
      stageTwoReset = true;

    if (timePaused != 0) {
      drawInit();
      timePaused = 0;
    }
  });

  $("#reset").click(function() {
    console.log("reset Timer");
    if (stageTwoReset == false) {
      stageTwoReset = true;
    } else {
      console.log("Reset to initial values");
      restPeriod = 5;
      workPeriod = 25;
      $(".consoleDisplay.rest").html(restPeriod);
      $(".consoleDisplay.work").html(workPeriod);
      stageTwoReset = false;
    }
  });

  $(".button.rest").click(function() {
    if ($(this).hasClass("minus")) {
      if (restPeriod > 1)
        restPeriod--;
    } else {
      restPeriod++;
    }
    $(".consoleDisplay.rest").html(restPeriod);
  });

  $(".button.work").click(function() {
    if ($(this).hasClass("minus")) {
      if (workPeriod > 1)
        workPeriod--;
    } else {
      workPeriod++;
    }
    $(".consoleDisplay.work").html(workPeriod);
  });

  canvas = document.getElementById("canvas");
  context = canvas.getContext("2d");

  drawInit();
}

$(document).ready(function() {
  init();
});