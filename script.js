const youtubeContainer = document.getElementById("youtube-container");
const quizSection = document.getElementById("quiz");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const checkBtn = document.getElementById("check-btn");
const resultEl = document.getElementById("result");
const nextBtn = document.getElementById("next-btn");

let currentAnswer = "";

// Load videos and start
async function initGame() {
  try {
    const response = await fetch("data/videos.json");
    const videos = await response.json();
    loadRandomVideo(videos);
  } catch (err) {
    console.error("Failed to load videos:", err);
    resultEl.textContent = "Error loading cases.";
  }
}

function loadRandomVideo(videos) {
  const video = videos[Math.floor(Math.random() * videos.length)];
  currentAnswer = video.answer;

  // Load YouTube iframe
  youtubeContainer.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${video.id}"
      title="Medical Case Video"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen>
    </iframe>
  `;

  // Fetch MCQ from AI via Vercel function
  generateMCQ(video.answer);
}

async function generateMCQ(disease) {
  quizSection.classList.remove("hidden");
  resultEl.textContent = "Generating question...";
  optionsEl.innerHTML = "";
  checkBtn.disabled = true;

  try {
    const res = await fetch("https://your-vercel-app.vercel.app/api/mcq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disease }),
    });

    const data = await res.json();
    const text = data.mcq || "No question generated.";

    // Parse AI response (simple format expected)
    const lines = text.split("\n").filter(l => l.trim());
    const question = lines[0];
    const options = lines.slice(1, 5); // first 4 options

    questionEl.textContent = question;
    options.forEach(opt => {
      const label = document.createElement("div");
      label.innerHTML = `
        <input type="radio" name="option" value="${opt}">
        ${opt}
      `;
      optionsEl.appendChild(label);
    });

    checkBtn.disabled = false;
    resultEl.textContent = "";

  } catch (err) {
    console.error("AI error:", err);
    resultEl.textContent = "Failed to generate question. Try again.";
  }
}

checkBtn.addEventListener("click", () => {
  const selected = optionsEl.querySelector('input[name="option"]:checked');
  if (!selected) {
    resultEl.textContent = "Please select an option!";
    return;
  }

  const userAnswer = selected.value;
  // Simple check: does it contain the correct disease name?
  if (userAnswer.toLowerCase().includes(currentAnswer.toLowerCase())) {
    resultEl.innerHTML = `<span style="color:green">✅ Correct!</span><br><em>"${currentAnswer}" is right.</em>`;
  } else {
    resultEl.innerHTML = `<span style="color:red">❌ Not quite.</span><br><em>The answer is: ${currentAnswer}</em>`;
  }
  nextBtn.classList.remove("hidden");
});

nextBtn.addEventListener("click", () => {
  quizSection.classList.add("hidden");
  nextBtn.classList.add("hidden");
  resultEl.textContent = "";
  initGame();
});

// Start the game
initGame();
