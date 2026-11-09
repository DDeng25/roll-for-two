const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const scenes = $$(".scene");
const body = document.body;
const settingsPanel = $("#settingsPanel");
const settingsTrigger = $("#settingsTrigger");
const darkroom = $("#darkroom");
const lampCord = $("#lampCord");
const radioQuote = $("#radioQuote");
const envelope = $("#envelope");
const tearStrip = $("#tearStrip");
const tearHint = $("#tearHint");
const letterText = $("#letterText");
const letterSheet = $("#letterSheet");
const toGallery = $("#toGallery");
const contactWindow = $(".contact-window");
const contactStrip = $("#contactStrip");
const photoDialog = $("#photoDialog");
const motionToggle = $("#motionToggle");
const musicToggle = $("#musicToggle");
const soundLabel = $("#soundLabel");
const volumeInput = $("#volume");
const grainInput = $("#grainLevel");

const storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // A restricted preview can still run without persistence.
    }
  },
};

const since = new Date("2026-05-10T00:00:00+08:00");
const today = new Date();
const days = Math.max(1, Math.floor((today - since) / 86400000) + 1);
$("#daysTogether").textContent = days;
$("#creditsDays").textContent = days;

const translations = {
  en: {
    soundOff: "SOUND OFF",
    soundOn: "SOUND ON",
    settings: "SETTINGS",
    rollButton: "roll it, darling",
  },
  zh: {
    soundOff: "声音关闭",
    soundOn: "声音开启",
    settings: "设置",
    rollButton: "放吧，亲爱的",
  },
};

let currentLang = storage.get("roll.lang", "en");
let currentSound = storage.get("roll.sound", "off");
let reduceMotion = storage.get("roll.motion", "on") === "off";

function setLanguage(lang) {
  currentLang = lang;
  storage.set("roll.lang", lang);
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  $$(".segment").forEach((button) => button.classList.toggle("is-active", button.dataset.lang === lang));
  $$("[data-en][data-zh]").forEach((element) => {
    element.textContent = element.dataset[lang];
  });
  settingsTrigger.querySelector("span").textContent = translations[lang].settings;
  soundLabel.textContent = body.classList.contains("music-on") ? translations[lang].soundOn : translations[lang].soundOff;
}

function updateGrain(value) {
  const normalized = Number(value) / 100;
  document.documentElement.style.setProperty("--grain-opacity", String(0.04 + normalized * 0.3));
  storage.set("roll.grain", String(value));
}

function applySettings() {
  const storedGrain = storage.get("roll.grain", "56");
  grainInput.value = storedGrain;
  updateGrain(storedGrain);
  setLanguage(currentLang);
  setMotion(!reduceMotion);
  setSound(currentSound === "on");
}

function openSettings(open) {
  settingsPanel.classList.toggle("is-open", open);
  settingsPanel.setAttribute("aria-hidden", String(!open));
  settingsTrigger.setAttribute("aria-expanded", String(open));
  body.classList.toggle("settings-open", open);
}

settingsTrigger.addEventListener("click", (event) => {
  event.stopPropagation();
  openSettings(!settingsPanel.classList.contains("is-open"));
});

$("#settingsClose").addEventListener("click", () => openSettings(false));
settingsPanel.addEventListener("click", (event) => event.stopPropagation());
document.addEventListener("click", () => openSettings(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") openSettings(false);
});

$$(".segment").forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
});

grainInput.addEventListener("input", () => updateGrain(grainInput.value));

function setMotion(enabled) {
  reduceMotion = !enabled;
  body.classList.toggle("reduce-motion", reduceMotion);
  motionToggle.setAttribute("aria-pressed", String(enabled));
  motionToggle.textContent = enabled ? "ON" : "OFF";
  storage.set("roll.motion", enabled ? "on" : "off");
}

motionToggle.addEventListener("click", () => setMotion(reduceMotion));

// A tiny, generated projector room. It begins only after an explicit user action.
let audioContext = null;
let projectorGain = null;
let projectorNodes = [];

function createProjectorSound() {
  if (audioContext) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  audioContext = new AudioContext();
  projectorGain = audioContext.createGain();
  projectorGain.gain.value = Number(volumeInput.value) / 100 * 0.055;
  projectorGain.connect(audioContext.destination);

  const hum = audioContext.createOscillator();
  const humGain = audioContext.createGain();
  hum.type = "sine";
  hum.frequency.value = 48;
  humGain.gain.value = 0.21;
  hum.connect(humGain).connect(projectorGain);
  hum.start();

  const flutter = audioContext.createOscillator();
  const flutterGain = audioContext.createGain();
  flutter.type = "triangle";
  flutter.frequency.value = 6.3;
  flutterGain.gain.value = 0.015;
  flutter.connect(flutterGain).connect(projectorGain.gain);
  flutter.start();

  const length = audioContext.sampleRate * 2;
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.055;
  }
  const noise = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const noiseGain = audioContext.createGain();
  noise.buffer = buffer;
  noise.loop = true;
  filter.type = "bandpass";
  filter.frequency.value = 1200;
  filter.Q.value = 0.45;
  noiseGain.gain.value = 0.12;
  noise.connect(filter).connect(noiseGain).connect(projectorGain);
  noise.start();
  projectorNodes = [hum, flutter, noise];
}

function playTone(frequency = 180, duration = 0.06) {
  if (currentSound !== "on") return;
  createProjectorSound();
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.028, audioContext.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration + 0.02);
}

function setSound(enabled) {
  currentSound = enabled ? "on" : "off";
  storage.set("roll.sound", currentSound);
  body.classList.toggle("music-on", enabled);
  musicToggle.setAttribute("aria-pressed", String(enabled));
  musicToggle.textContent = enabled ? "ON" : "OFF";
  soundLabel.textContent = translations[currentLang][enabled ? "soundOn" : "soundOff"];
  if (enabled) {
    createProjectorSound();
    audioContext?.resume();
    if (projectorGain) projectorGain.gain.value = Number(volumeInput.value) / 100 * 0.055;
  } else if (projectorGain && audioContext) {
    projectorGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.04);
  }
}

musicToggle.addEventListener("click", () => setSound(currentSound !== "on"));
volumeInput.addEventListener("input", () => {
  if (projectorGain && audioContext && currentSound === "on") {
    projectorGain.gain.setTargetAtTime(Number(volumeInput.value) / 100 * 0.055, audioContext.currentTime, 0.03);
  }
});

applySettings();

// Layered pointer parallax, kept subtle and disabled when requested.
const parallaxItems = $$(".parallax");
document.addEventListener(
  "pointermove",
  (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    document.documentElement.style.setProperty("--mx", x.toFixed(3));
    document.documentElement.style.setProperty("--my", y.toFixed(3));
    if (reduceMotion) return;
    parallaxItems.forEach((item) => {
      const depth = Number(item.dataset.depth || 0);
      item.style.transform = `translate3d(${-x * depth}px, ${-y * depth * 0.62}px, 0)`;
    });
  },
  { passive: true },
);

// Scene rail and reveal states.
const sceneObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      $$(".reel-dot").forEach((dot) => dot.classList.toggle("is-active", dot.dataset.target === id));
    });
  },
  { threshold: 0.42 },
);

scenes.forEach((scene) => sceneObserver.observe(scene));
$$(".reel-dot").forEach((button) => {
  button.addEventListener("click", () => $(`#${button.dataset.target}`).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }));
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("in-view");
    });
  },
  { threshold: 0.18 },
);

$$(".gallery-head, .contact-window, .gallery-footer, .rolls-table, .credits-copy").forEach((element) => {
  element.classList.add("reveal");
  revealObserver.observe(element);
});

$("#startButton").addEventListener("click", () => {
  playTone(220, 0.12);
  $("#darkroom").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
});

// The cord supports both click and a real downward drag.
let cordDragging = false;
let cordStartY = 0;
let cordMoved = false;

function toggleDarkroom(force) {
  const next = typeof force === "boolean" ? force : !darkroom.classList.contains("is-lit");
  if (next === darkroom.classList.contains("is-lit")) return;
  darkroom.classList.toggle("is-lit", next);
  lampCord.setAttribute("aria-pressed", String(next));
  lampCord.classList.remove("is-pulled");
  playTone(next ? 92 : 70, 0.16);
  if (next) typeRadio();
}

lampCord.addEventListener("pointerdown", (event) => {
  cordDragging = true;
  cordMoved = false;
  cordStartY = event.clientY;
  lampCord.setPointerCapture(event.pointerId);
  lampCord.classList.add("is-pulled");
});

lampCord.addEventListener("pointermove", (event) => {
  if (!cordDragging) return;
  const distance = event.clientY - cordStartY;
  lampCord.style.transform = `translateY(${Math.max(0, Math.min(62, 9 + distance))}px)`;
  cordMoved = cordMoved || distance > 8;
});

lampCord.addEventListener("pointerup", () => {
  if (!cordDragging) return;
  cordDragging = false;
  lampCord.style.transform = "";
  if (cordMoved) toggleDarkroom();
});

lampCord.addEventListener("click", () => {
  if (cordMoved) {
    cordMoved = false;
    return;
  }
  toggleDarkroom();
});

lampCord.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleDarkroom();
  }
});

let radioTimer = null;
let radioTypedFor = -1;
const radioCopy =
  "Good evening. This next one is for you, from someone who kept every single frame. Brought to you by Darkroom Seven.";

function typeRadio() {
  if (radioTypedFor === 2) return;
  radioTypedFor = 2;
  clearTimeout(radioTimer);
  radioQuote.textContent = "";
  let index = 0;
  const tick = () => {
    radioQuote.textContent = radioCopy.slice(0, index);
    index += 1;
    if (index <= radioCopy.length) {
      radioTimer = setTimeout(tick, reduceMotion ? 0 : 34 + (index % 5) * 5);
    } else {
      radioTypedFor = 3;
    }
  };
  tick();
}

$("#toLetter").addEventListener("click", () => $("#envelope").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }));

// Envelope tear interaction.
let tearing = false;
let tearStartX = 0;
let tearAmount = Number(getComputedStyle(envelope).getPropertyValue("--tear")) || 0;
let openedEnvelope = false;

function setTear(value, open = false) {
  tearAmount = Math.max(0, Math.min(1, value));
  envelope.style.setProperty("--tear", tearAmount.toFixed(3));
  envelope.classList.toggle("is-tearing", tearAmount > 0.02 && tearAmount < 0.92);
  if (!open && tearAmount >= 0.84) openEnvelope();
}

function openEnvelope() {
  if (openedEnvelope) return;
  openedEnvelope = true;
  envelope.classList.add("is-open");
  envelope.classList.remove("is-tearing");
  envelope.style.setProperty("--tear", "1");
  tearHint.style.opacity = "0";
  toGallery.disabled = false;
  playTone(110, 0.2);
  setTimeout(typeLetter, reduceMotion ? 300 : 1850);
}

tearStrip.addEventListener("pointerdown", (event) => {
  if (openedEnvelope) return;
  tearing = true;
  tearStartX = event.clientX;
  tearStrip.setPointerCapture(event.pointerId);
});

tearStrip.addEventListener("pointermove", (event) => {
  if (!tearing || openedEnvelope) return;
  const bounds = $(".processing-envelope").getBoundingClientRect();
  const progress = Math.max(tearAmount, (event.clientX - bounds.left) / bounds.width);
  setTear(progress);
});

tearStrip.addEventListener("pointerup", () => {
  tearing = false;
  if (!openedEnvelope) {
    setTear(tearAmount > 0.5 ? Math.min(0.82, tearAmount) : 0);
  }
});

tearStrip.addEventListener("click", () => {
  if (!openedEnvelope && tearAmount < 0.08) setTear(0.9);
});

tearStrip.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openEnvelope();
  }
});

const letterCopy = `Dear Tong,

I'm bad at saying things out loud,
so I put them on film instead.

Twenty-four frames.
A little too warm,
a little out of focus.

Exactly like us.`;

let letterStarted = false;
function typeLetter() {
  if (letterStarted) return;
  letterStarted = true;
  letterText.textContent = "";
  let index = 0;
  const tick = () => {
    letterText.textContent = letterCopy.slice(0, index);
    index += 1;
    if (index <= letterCopy.length) {
      const char = letterCopy[index - 1];
      const delay = reduceMotion ? 0 : char === "\n" ? 200 : /[.,]/.test(char) ? 115 : 32 + Math.random() * 28;
      setTimeout(tick, delay);
    } else {
      letterSheet.classList.add("is-complete");
    }
  };
  tick();
}

toGallery.addEventListener("click", () => $("#gallery").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }));

// Horizontal film strip: native wheel mapping, drag-to-scroll, and a live counter.
let contactDragging = false;
let contactStartX = 0;
let contactScroll = 0;
let contactMoved = false;
let pressedPhoto = null;

contactWindow.addEventListener("wheel", (event) => {
  if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
  if (event.shiftKey || window.innerWidth < 700) {
    contactWindow.scrollLeft += event.deltaY;
  }
}, { passive: true });

contactWindow.addEventListener("pointerdown", (event) => {
  contactDragging = true;
  contactMoved = false;
  contactStartX = event.clientX;
  contactScroll = contactWindow.scrollLeft;
  pressedPhoto = event.target.closest(".photo-frame");
  contactWindow.classList.add("is-dragging");
});

contactWindow.addEventListener("pointermove", (event) => {
  if (!contactDragging) return;
  const delta = event.clientX - contactStartX;
  if (Math.abs(delta) > 5) {
    contactMoved = true;
    pressedPhoto = null;
  }
  contactWindow.scrollLeft = contactScroll - delta;
});

contactWindow.addEventListener("pointerup", () => {
  contactDragging = false;
  contactWindow.classList.remove("is-dragging");
  if (pressedPhoto && !contactMoved) pressedPhoto.click();
  pressedPhoto = null;
});

$$(".photo-frame").forEach((frame, index) => {
  frame.addEventListener("click", () => {
    if (photoDialog.open) return;
    if (contactMoved) {
      contactMoved = false;
      return;
    }
    const image = $("img", frame);
    $("#dialogPhoto").src = frame.dataset.large;
    $("#dialogPhoto").alt = image.alt;
    $("#dialogCaption").textContent = frame.dataset.caption;
    $(".dialog-frame-no").textContent = `FRAME ${frame.querySelector(".frame-no").textContent}`;
    $("#galleryIndex").textContent = String(index + 1).padStart(2, "0");
    photoDialog.showModal();
    playTone(155, 0.07);
  });
});

$("#dialogClose").addEventListener("click", () => photoDialog.close());
photoDialog.addEventListener("click", (event) => {
  const bounds = photoDialog.getBoundingClientRect();
  const outside =
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom;
  if (outside) photoDialog.close();
});

$("#toRolls").addEventListener("click", () => $("#rolls").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }));
$("#toCredits").addEventListener("click", () => $("#credits").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }));
$("#restartButton").addEventListener("click", () => {
  playTone(75, 0.25);
  $("#opening").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
});

const rolls = {
  mature: {
    title: "Mature",
    meta: "ROLL 01 · 2025—2026",
    line: "“The first roll was mostly mistakes. We kept them anyway.”",
    photos: ["frame-01.jpg", "frame-02.jpg", "frame-03.jpg"],
  },
  slow: {
    title: "slow days",
    meta: "ROLL 02 · 2026 · THE ORDINARY ONES",
    line: "“Nothing happened. That was the whole point.”",
    photos: ["frame-07.jpg", "frame-03.jpg", "frame-02.jpg"],
  },
  far: {
    title: "far away",
    meta: "ROLL 03 · SEP 2026 · THE DISTANCE",
    line: "“Every horizon looked like somewhere we had already been.”",
    photos: ["frame-06.jpg", "frame-04.jpg", "frame-01.jpg"],
  },
  us: {
    title: "still us",
    meta: "ROLL 04 · 2026 · WE",
    line: "“A city, a window, a quiet frame. Still us.”",
    photos: ["frame-05.jpg", "frame-08.jpg", "frame-07.jpg"],
  },
};

function selectRoll(key) {
  const roll = rolls[key];
  $$(".canister").forEach((button) => {
    const active = button.dataset.roll === key;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  $("#rollTitle").textContent = roll.title;
  $("#rollMeta").textContent = roll.meta;
  $("#rollLine").textContent = roll.line;
  $("#rollPreview").innerHTML = roll.photos
    .map((photo, index) => `<figure style="--i:${index}"><img src="assets/${photo}" alt="Preview from the ${roll.title} roll"></figure>`)
    .join("");
  playTone(128 + Object.keys(rolls).indexOf(key) * 18, 0.08);
}

$$(".canister").forEach((button) => {
  button.addEventListener("click", () => selectRoll(button.dataset.roll));
});

selectRoll("mature");

// Keyboard-only wheel entry for the darkroom scroll cue.
document.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowDown" || !darkroom.classList.contains("is-lit")) return;
  const rect = darkroom.getBoundingClientRect();
  if (rect.top > -100 && rect.bottom > window.innerHeight * 0.8) {
    $("#envelope").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }
});
