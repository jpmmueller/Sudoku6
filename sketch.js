// sketch.js
// -----------------------------
// Globale Variablen, p5-Setup/Draw, Eingabe-Logik

// --- State --------------------------------------------------------------

let board = [
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0]
];

let conflicts = Array.from({ length: 9 }, () =>
  Array.from({ length: 9 }, () => false)
);

let hiddenCandidates = Array.from({ length: 9 }, () =>
  Array.from({ length: 9 }, () => Array(10).fill(false)) // Index 1..9
);

let selectedRow = 0;
let selectedCol = 0;

let cellSize = 50;
let originX = 0;
let originY = 0;

let showCandidates = true;
let candidateEditMode = false;
let highlightDigit = null;

// Nachricht vom Solver (wird im UI angezeigt)
let solverMessage = "";

// --- p5 Setup / Draw ----------------------------------------------------

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('monospace');
  updateLayout();
  noLoop();
  syncModeControls(); // Checkboxen an Anfangszustand anpassen
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateLayout();
  redraw();
}

function updateLayout() {
  const gridSize = cellSize * 9;
  originX = (width - gridSize) / 2;
  originY = (height - gridSize) / 2;
}

function draw() {
  background(100);
  drawGrid();
  drawCells();
  drawSelection();
  drawNumberPanel();
}

// --- Checkbox-Sync ------------------------------------------------------

function syncModeControls() {
  const candBox = document.getElementById('toggleCandidates');
  const editBox = document.getElementById('toggleEditMode');

  if (candBox) {
    candBox.checked = showCandidates;
  }
  if (editBox) {
    editBox.checked = candidateEditMode;
    editBox.disabled = !showCandidates;

    // CSS-Klasse für optische Deaktivierung
    const label = editBox.closest('.toggle');
    if (label) {
      if (!showCandidates) {
        label.classList.add('disabled');
      } else {
        label.classList.remove('disabled');
      }
    }
  }
}

// Wird von der Checkbox "Kandidaten anzeigen" aufgerufen
function onToggleCandidates(checkbox) {
  showCandidates = checkbox.checked;
  if (!showCandidates) {
    candidateEditMode = false; // Editmodus deaktivieren
  }
  solverMessage = "";
  syncModeControls();
  redraw();
}

// Wird von der Checkbox "Editmodus" aufgerufen
function onToggleEditMode(checkbox) {
  if (!showCandidates) {
    // Falls jemand klickt, während Kandidaten aus sind: ignorieren
    checkbox.checked = false;
    candidateEditMode = false;
  } else {
    candidateEditMode = checkbox.checked;
  }
  solverMessage = "";
  syncModeControls();
  redraw();
}

// --- Eingabe ------------------------------------------------------------

function mousePressed() {
  const cell = screenToCell(mouseX, mouseY);
  if (cell) {
    selectedRow = cell.row;
    selectedCol = cell.col;
    redraw();
    return;
  }

  const digit = panelHitTest(mouseX, mouseY);
  if (digit !== null) {
    if (highlightDigit === digit) {
      highlightDigit = null;
    } else {
      highlightDigit = digit;
    }
    solverMessage = "";
    redraw();
  }
}

function keyPressed() {
  // K: Kandidaten anzeigen/verstecken
  if (key === 'k' || key === 'K') {
    showCandidates = !showCandidates;
    if (!showCandidates) {
      candidateEditMode = false;
    }
    solverMessage = "";
    syncModeControls();
    redraw();
    return;
  }

  // E: Editmodus für Kandidaten nur, wenn Kandidaten sichtbar
  if (key === 'e' || key === 'E') {
    if (showCandidates) {
      candidateEditMode = !candidateEditMode;
      solverMessage = "";
      syncModeControls();
      redraw();
    }
    return;
  }

  // Pfeiltasten
  if (keyCode === LEFT_ARROW) {
    selectedCol = (selectedCol + 8) % 9;
    redraw();
    return;
  }
  if (keyCode === RIGHT_ARROW) {
    selectedCol = (selectedCol + 1) % 9;
    redraw();
    return;
  }
  if (keyCode === UP_ARROW) {
    selectedRow = (selectedRow + 8) % 9;
    redraw();
    return;
  }
  if (keyCode === DOWN_ARROW) {
    selectedRow = (selectedRow + 1) % 9;
    redraw();
    return;
  }

  // Löschen
  if (key === '0' || keyCode === BACKSPACE || keyCode === DELETE) {
    board[selectedRow][selectedCol] = 0;
    recomputeConflicts();
    for (let v = 1; v <= 9; v++) {
      hiddenCandidates[selectedRow][selectedCol][v] = false;
    }
    solverMessage = "";
    redraw();
    return;
  }

  // Ziffern 1..9
  if (key >= '1' && key <= '9') {
    const value = int(key);

    if (showCandidates && candidateEditMode && board[selectedRow][selectedCol] === 0) {
      // Kandidat in leerer Zelle toggeln
      if (isValueAllowed(selectedRow, selectedCol, value)) {
        hiddenCandidates[selectedRow][selectedCol][value] =
          !hiddenCandidates[selectedRow][selectedCol][value];
      }
    } else {
      // normale Zahl setzen
      board[selectedRow][selectedCol] = value;
      recomputeConflicts();
      for (let v = 1; v <= 9; v++) {
        hiddenCandidates[selectedRow][selectedCol][v] = false;
      }
    }

    solverMessage = "";
    redraw();
  }
}
