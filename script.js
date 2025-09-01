// DOM Elements
const youtubeContainer = document.getElementById("youtube-container");
const playOverlay = document.getElementById("play-overlay");
const playBtn = document.getElementById("play-btn");
const videoFrame = document.getElementById("video-frame");
const quizSection = document.getElementById("quiz");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const checkBtn = document.getElementById("check-btn");
const resultEl = document.getElementById("result");
const nextBtn = document.getElementById("next-btn");
const explainBtn = document.getElementById("explain-btn");

let currentVideo = null;
let currentAnswer = "";
let currentMCQ = "";

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
  initGame();
  setupEventListeners();
});

function setupEventListeners() {
  playBtn.addEventListener("click", playVideo);
  checkBtn.addEventListener("click", checkAnswer);
  nextBtn.addEventListener("click", loadNextVideo);
  explainBtn.addEventListener("click", getExplanation);
}

async function initGame() {
  try {
    const response = await fetch("data/videos.json");
    const videos = await response.json();
    loadRandomVideo(videos);
  } catch (err) {
    console.error("Failed to load videos:", err);
    resultEl.innerHTML = `<span class="error">⚠️ Error loading cases. Please refresh.</span>`;
    quizSection.classList.remove("hidden");
  }
}

function loadRandomVideo(videos) {
  // Hide previous elements
  quizSection.classList.add("hidden");
  nextBtn.classList.add("hidden");
  explainBtn.classList.add("hidden");
  resultEl.textContent = "";
  optionsEl.innerHTML = "";

  // Get random video
  currentVideo = videos[Math.floor(Math.random() * videos.length)];
  currentAnswer = currentVideo.answer;
  
  // Reset video player
  playOverlay.style.display = "flex";
  videoFrame.innerHTML = "";
  videoFrame.style.display = "none";
}

function playVideo() {
  playOverlay.style.display = "none";
  videoFrame.style.display = "block";
  
  // Load YouTube with privacy settings
  videoFrame.innerHTML = `
    <iframe
      src="https://www.youtube-nocookie.com/embed/${currentVideo.id}?rel=0&controls=1&modestbranding=1&iv_load_policy=3&autoplay=1"
      title="Medical Diagnosis Video - No Spoilers"
      frameborder="0"
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>
  `;
  
  // Generate quiz after video starts
  setTimeout(() => {
    generateMCQ(currentVideo.answer);
  }, 2000);
}

async function generateMCQ(disease) {
  quizSection.classList.remove("hidden");
  resultEl.innerHTML = '<div class="loading">🧠 AI is generating your question...</div>';
  optionsEl.innerHTML = "";
  checkBtn.disabled = true;

  try {
    const response = await fetch("https://your-vercel-api.vercel.app/api/mcq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disease }),
    });

    const data = await response.json();
    currentMCQ = data.mcq || "Failed to generate question. Try again.";
    
    // Parse AI response
    parseMCQ(currentMCQ);
    
  } catch (err) {
    console.error("AI error:", err);
    resultEl.innerHTML = `
      <span class="error">
        ⚠️ Failed to generate question. 
        <a href="#" onclick="window.location.reload()">Refresh</a> or try next case.
      </span>
    `;
  }
}

function parseMCQ(mcqText) {
  // Clean and parse the AI response
  const cleanText = mcqText
    .replace(/\*\*/g, '')
    .replace(/\[.*?\]/g, '')
    .trim();
  
  const lines = cleanText.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('Answer:'));
  
  // Extract question (first non-empty line)
  const question = lines[0] || "What is the most likely diagnosis?";
  
  // Extract options (next 4 lines)
  const options = [];
  for (let i = 1; i < lines.length && options.length < 4; i++) {
    let option = lines[i].replace(/^[A-Da-d]\)\s*/, '').trim();
    if (option) options.push(option);
  }
  
  // Fallback if AI didn't provide enough options
  if (options.length < 2) {
    options.push("Option A", "Option B", "Option C", "Option D");
  }
  
  // Display question
  questionEl.textContent = question;
  
  // Display options
  options.forEach((option, index) => {
    const letter = String.fromCharCode(65 + index); // A, B, C, D
    const isCorrect = option.includes('*');
    const displayOption = option.replace(/\*/, '').trim();
    
    const optionEl = document.createElement("div");
    optionEl.className = "option";
    optionEl.innerHTML = `
      <input type="radio" name="option" id="opt${index}" value="${displayOption}">
      <label for="opt${index}"><strong>${letter})</strong> ${displayOption}</label>
    `;
    
    optionsEl.appendChild(optionEl);
  });
  
  checkBtn.disabled = false;
  resultEl.textContent = "";
}

function checkAnswer() {
  const selected = optionsEl.querySelector('input[name="option"]:checked');
  if (!selected) {
    resultEl.innerHTML = '<span class="warning">⚠️ Please select an answer!</span>';
    return;
  }

  const userAnswer = selected.value.toLowerCase();
  const correctAnswer = currentAnswer.toLowerCase();
  
  // Check if answer contains key terms
  const isCorrect = 
    userAnswer.includes(correctAnswer) || 
    correctAnswer.includes(userAnswer) ||
    userAnswer.includes('parkinson') && correctAnswer.includes('parkinson');
  
  if (isCorrect) {
    resultEl.innerHTML = `
      <div class="success">
        <h3>✅ Correct Diagnosis!</h3>
        <p><strong>${currentAnswer}</strong> is the right answer.</p>
      </div>
    `;
  } else {
    resultEl.innerHTML = `
      <div class="error">
        <h3>❌ Not quite right</h3>
        <p>The correct diagnosis is: <strong>${currentAnswer}</strong></p>
      </div>
    `;
  }
  
  nextBtn.classList.remove("hidden");
  explainBtn.classList.remove("hidden");
}

function getExplanation() {
  resultEl.innerHTML = '<div class="loading">💡 AI is explaining the diagnosis...</div>';
  explainBtn.disabled = true;
  
  fetch("https://your-vercel-api.vercel.app/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      disease: currentAnswer,
      mcq: currentMCQ
    }),
  })
  .then(res => res.json())
  .then(data => {
    resultEl.innerHTML = `
      <div class="explanation">
        <h3>🔍 Clinical Explanation</h3>
        <p>${data.explanation || "Here's why this is the correct diagnosis..."}</p>
      </div>
    `;
    explainBtn.disabled = false;
  })
  .catch(() => {
    resultEl.innerHTML = `
      <div class="error">
        <h3>⚠️ Could not load explanation</h3>
        <p>Try again or proceed to next case.</p>
      </div>
    `;
    explainBtn.disabled = false;
  });
}

function loadNextVideo() {
  initGame();
}
