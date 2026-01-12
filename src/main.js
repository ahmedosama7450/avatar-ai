import * as THREE from "three";
import { Avatar } from "./Avatar.js";
import { generateContent } from "./gemini.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

const container = document.getElementById("container");
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

camera.position.z = 4;
camera.position.y = 0.5;
camera.aspect = container.clientWidth / container.clientHeight;
camera.updateProjectionMatrix();

// Avatar
const avatar = new Avatar(scene);

// Clock
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  avatar.update(dt);
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

console.log("Three.js scene initialized");

// UI Logic
let apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const chatContainer = document.getElementById("chat-container");
const avatarBubble = document.getElementById("avatar-bubble");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const voiceToggleBtn = document.getElementById("voice-toggle-btn");
const voiceStatus = document.getElementById("voice-status");
const voiceStatusText = document.getElementById("voice-status-text");

let isVoiceMode = false;
let recognition = null;

if (apiKey) {
  chatContainer.style.display = "block";
  startInteraction();
} else {
  console.error("VITE_GEMINI_API_KEY is not defined in environment variables.");
  alert("Gemini API key is missing. Please check your .env file.");
}

function updateAvatarBubble(text) {
  avatarBubble.textContent = text;
}

async function startInteraction() {
  updateAvatarBubble(
    "Hi! My name is Ava. I'm learning how to brush my teeth. Can you help me?"
  );
  avatar.setAnimation("wave");
}

// Speech Recognition Setup
if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    voiceStatus.className = "listening";
    voiceStatusText.textContent = "Listening...";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
    handleUserResponse();
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    if (isVoiceMode && event.error !== "no-speech") {
      stopVoiceMode();
    } else if (isVoiceMode && event.error === "no-speech") {
      recognition.start();
    }
  };

  recognition.onend = () => {
    if (isVoiceMode && !window.speechSynthesis.speaking) {
      recognition.start();
    }
  };
}

function startVoiceMode() {
  if (!recognition) {
    alert("Speech recognition is not supported in this browser.");
    return;
  }
  isVoiceMode = true;
  voiceToggleBtn.textContent = "Stop Voice Mode";
  voiceToggleBtn.classList.add("active");
  voiceStatus.classList.remove("voice-status-hidden");
  recognition.start();
}

function stopVoiceMode() {
  isVoiceMode = false;
  voiceToggleBtn.textContent = "Start Voice Mode";
  voiceToggleBtn.classList.remove("active");
  voiceStatus.className = "voice-status-hidden";
  if (recognition) recognition.stop();
  window.speechSynthesis.cancel();
}

voiceToggleBtn.addEventListener("click", () => {
  if (isVoiceMode) {
    stopVoiceMode();
  } else {
    startVoiceMode();
  }
});

function speak(text) {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => {
      voiceStatus.className = "speaking";
      voiceStatusText.textContent = "Speaking...";
      avatar.setAnimation("speaking");
    };
    utterance.onend = () => {
      avatar.setAnimation("idle");
      if (isVoiceMode) {
        voiceStatus.className = "listening";
        voiceStatusText.textContent = "Listening...";
        recognition.start();
      }
      resolve();
    };
    window.speechSynthesis.speak(utterance);
  });
}

async function handleUserResponse() {
  const text = userInput.value.trim();
  if (!text) return;

  userInput.value = "";
  updateAvatarBubble("Thinking...");
  if (isVoiceMode) {
    voiceStatus.className = "processing";
    voiceStatusText.textContent = "Thinking...";
  }

  const prompt = `
    You are a friendly cartoon avatar named Ava for an autistic child.
    You are learning how to brush your teeth.
    The user just said: "${text}".

    Your goal is to have a short interaction (2-3 turns).

    If the user gives good advice, be happy and say thank you.
    If the user says something unclear, ask for clarification gently.

    Output a JSON object with two fields:
    "response": "Your verbal response here",
    "emotion": "happy" or "neutral" or "confused"

    Do not include markdown formatting. Just raw JSON.
    `;

  try {
    const rawResponse = await generateContent(apiKey, prompt);
    let aiData;
    try {
      const cleanJson = rawResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      aiData = JSON.parse(cleanJson);
    } catch (e) {
      aiData = { response: rawResponse, emotion: "neutral" };
    }

    updateAvatarBubble(aiData.response);

    if (aiData.emotion === "happy") {
      avatar.setAnimation("nod");
    }

    if (isVoiceMode) {
      await speak(aiData.response);
    }
  } catch (err) {
    console.error(err);
    const errorMsg = "Oops, I got a bit confused. Can you say that again?";
    updateAvatarBubble(errorMsg);
    if (isVoiceMode) {
      await speak(errorMsg);
    }
  }
}

sendBtn.addEventListener("click", handleUserResponse);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleUserResponse();
});
