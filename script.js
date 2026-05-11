const stage = document.getElementById("stage");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");

const uploadModal = document.getElementById("uploadModal");
const uploadAsW = document.getElementById("uploadAsW");
const uploadAsOther = document.getElementById("uploadAsOther");

const modeLabel = document.getElementById("modeLabel");

// TEMPO HIER ÄNDERN
const MIN_SPEED = 3;
const MAX_SPEED = 5;

// GRÖSSE DER SVGs HIER ÄNDERN
const LETTER_SIZE = 160;

// ZEITFENSTER FÜR DOPPELTES SPACE-DRÜCKEN
const DOUBLE_SPACE_TIME = 280;

let pendingFiles = [];
let letters = [];
let selectedLetter = null;

let showOthers = false;
let spinning = false;

let lastSpacePress = 0;
let singleSpaceTimer = null;

uploadButton.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (event) => {
  pendingFiles = Array.from(event.target.files).filter((file) =>
    file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")
  );

  if (pendingFiles.length > 0) {
    uploadModal.classList.remove("hidden");
  }

  fileInput.value = "";
});

uploadAsW.addEventListener("click", () => {
  addFilesToStage("w");
  uploadModal.classList.add("hidden");
});

uploadAsOther.addEventListener("click", () => {
  addFilesToStage("other");
  uploadModal.classList.add("hidden");
});

function addFilesToStage(type) {
  pendingFiles.forEach((file) => {
    const url = URL.createObjectURL(file);

    const img = document.createElement("img");
    img.src = url;
    img.classList.add("floating-letter");
    img.dataset.type = type;

    img.style.width = `${LETTER_SIZE}px`;
    img.style.height = `${LETTER_SIZE}px`;

    const startX = Math.random() * (window.innerWidth - LETTER_SIZE);
    const startY = Math.random() * (window.innerHeight - LETTER_SIZE);

    img.style.left = `${startX}px`;
    img.style.top = `${startY}px`;

    if (type === "other" && !showOthers) {
      img.classList.add("hidden-letter");
    }

    if (spinning) {
      img.classList.add("spinning");
    }

    stage.appendChild(img);

    const movement = createStraightIndividualMovement();

    const letterObject = {
      element: img,
      x: startX,
      y: startY,
      vx: movement.vx,
      vy: movement.vy,
      type: type,
      url: url
    };

    letters.push(letterObject);

    img.addEventListener("click", (event) => {
      event.stopPropagation();
      selectLetter(letterObject);
    });
  });

  pendingFiles = [];
}

function createStraightIndividualMovement() {
  const angle = Math.random() * Math.PI * 2;
  const speed = randomBetween(MIN_SPEED, MAX_SPEED);

  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function selectLetter(letterObject) {
  if (selectedLetter) {
    selectedLetter.element.classList.remove("selected");
  }

  selectedLetter = letterObject;
  selectedLetter.element.classList.add("selected");
}

stage.addEventListener("click", () => {
  if (selectedLetter) {
    selectedLetter.element.classList.remove("selected");
    selectedLetter = null;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();

    const now = Date.now();
    const timeSinceLastSpace = now - lastSpacePress;

    if (timeSinceLastSpace < DOUBLE_SPACE_TIME) {
      clearTimeout(singleSpaceTimer);
      toggleSpin();
    } else {
      singleSpaceTimer = setTimeout(() => {
        toggleLetterMode();
      }, DOUBLE_SPACE_TIME);
    }

    lastSpacePress = now;
  }

  if (event.key === "Delete" || event.key === "Backspace") {
    deleteSelectedLetter();
  }
});

function toggleLetterMode() {
  showOthers = !showOthers;

  letters.forEach((letter) => {
    if (letter.type === "w") {
      letter.element.classList.toggle("hidden-letter", showOthers);
    }

    if (letter.type === "other") {
      letter.element.classList.toggle("hidden-letter", !showOthers);
    }
  });

  modeLabel.textContent = showOthers ? "SHOWING: OTHER LETTERS" : "SHOWING: W";
}

function toggleSpin() {
  spinning = !spinning;

  letters.forEach((letter) => {
    letter.element.classList.toggle("spinning", spinning);
  });
}

function deleteSelectedLetter() {
  if (!selectedLetter) return;

  selectedLetter.element.remove();

  if (selectedLetter.url) {
    URL.revokeObjectURL(selectedLetter.url);
  }

  letters = letters.filter((letter) => letter !== selectedLetter);
  selectedLetter = null;
}

function animate() {
  letters.forEach((letter) => {
    const element = letter.element;

    letter.x += letter.vx;
    letter.y += letter.vy;

    const width = element.offsetWidth;
    const height = element.offsetHeight;

    if (letter.x <= 0 || letter.x + width >= window.innerWidth) {
      letter.vx *= -1;
      letter.x = Math.max(0, Math.min(letter.x, window.innerWidth - width));
    }

    if (letter.y <= 0 || letter.y + height >= window.innerHeight) {
      letter.vy *= -1;
      letter.y = Math.max(0, Math.min(letter.y, window.innerHeight - height));
    }

    element.style.left = `${letter.x}px`;
    element.style.top = `${letter.y}px`;
  });

  requestAnimationFrame(animate);
}

animate();
