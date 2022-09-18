'use strict'
var visualizer = null;
var rendering = false;
var audioContext = null;
var sourceNode = null;
var delayedAudible = null;
var cycleInterval = null;
var presets = {};
var presetKeys = [];
var presetIndexHist = [];
var presetIndex = 0;
var presetCycle = true;
var presetCycleLength = 15000;
var presetRandom = true;
var canvas = document.getElementById("canvas");
const presetSelect = document.getElementById("presetSelect");
navigator.getUserMedia = ( navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia ||
    navigator.mediaDevices.getUserMedia);

function connectToAudioAnalyzer(sourceNode) {
  if (delayedAudible) {
    delayedAudible.disconnect();
  }

  delayedAudible = audioContext.createDelay();
  delayedAudible.delayTime.value = 0.26;

  sourceNode.connect(delayedAudible);
  delayedAudible.connect(audioContext.destination);

  visualizer.connectAudio(delayedAudible);
}

function startRenderer() {
  requestAnimationFrame(() => startRenderer());
  visualizer.render();
}

function playBufferSource(buffer) {
  if (!rendering) {
    rendering = true;
    startRenderer();
  }

  if (sourceNode) {
    sourceNode.disconnect();
  }

  sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = buffer;
  connectToAudioAnalyzer(sourceNode);

  sourceNode.start(0);
}

function getAudio() {
  navigator.getUserMedia(
    { audio: true },
    (stream) => {
      var micSourceNode = audioContext.createMediaStreamSource(stream);
      connectMicAudio(micSourceNode, audioContext);
    },
    (err) => {
      console.log("Error getting audio stream from getUserMedia");
    }
  );
}

function connectMicAudio(sourceNode, audioContext) {
  audioContext.resume();

  var gainNode = audioContext.createGain();
  gainNode.gain.value = 1.25;
  sourceNode.connect(gainNode);

  visualizer.connectAudio(gainNode);
  startRenderer();
}

function nextPreset(blendTime = 5.7) {
  presetIndexHist.push(presetIndex);

  var numPresets = presetKeys.length;
  if (presetRandom) {
    presetIndex = Math.floor(Math.random() * presetKeys.length);
  } else {
    presetIndex = (presetIndex + 1) % numPresets;
  }

  visualizer.loadPreset(presets[presetKeys[presetIndex]], blendTime);
}

function prevPreset(blendTime = 5.7) {
  var numPresets = presetKeys.length;
  if (presetIndexHist.length > 0) {
    presetIndex = presetIndexHist.pop();
  } else {
    presetIndex = (presetIndex - 1 + numPresets) % numPresets;
  }

  visualizer.loadPreset(presets[presetKeys[presetIndex]], blendTime);
}

function restartCycleInterval() {
  if (cycleInterval) {
    clearInterval(cycleInterval);
    cycleInterval = null;
  }

  if (presetCycle) {
    cycleInterval = setInterval(() => nextPreset(2.7), presetCycleLength);
  }
}

$("#micSelect").click(() => {
  $("#audioSelectWrapper").css("display", "none");

  navigator.getUserMedia(
    { audio: true },
    (stream) => {
      var micSourceNode = audioContext.createMediaStreamSource(stream);
      connectMicAudio(micSourceNode, audioContext);
    },
    (err) => {
      console.log("Error getting audio stream from getUserMedia");
    }
  );
});

function initPlayer() {
  audioContext = new AudioContext();

  presets = {};
  if (window.butterchurnPresets) {
    Object.assign(presets, butterchurnPresets.getPresets());
  }
  if (window.butterchurnPresetsExtra) {
    Object.assign(presets, butterchurnPresetsExtra.getPresets());
  }
  presets = _(presets)
    .toPairs()
    .sortBy(([k, v]) => k.toLowerCase())
    .fromPairs()
    .value();
  presetKeys = _.keys(presets);
  presetIndex = Math.floor(Math.random() * presetKeys.length);

  var presetSelect = document.getElementById("presetSelect");
  for (var i = 0; i < presetKeys.length; i++) {
    var opt = document.createElement("option");
    opt.innerHTML =
      presetKeys[i].substring(0, 60) + (presetKeys[i].length > 60 ? "..." : "");
    opt.value = i;
  }

  visualizer = butterchurn.default.createVisualizer(audioContext, canvas, {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    textureRatio: 1,
  });
  nextPreset(0);
  cycleInterval = setInterval(() => nextPreset(2.7), presetCycleLength);
}
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
initPlayer();
getAudio();
console.log(window.innerWidth);
console.log(window.width);
//get canvas to fullscreen
window.onload = window.onresize = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initPlayer();
    getAudio();
}
