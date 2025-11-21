// --- Datenmodell --------------------------------------------------------

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

// Konflikte (true = Zelle verletzt eine Sudoku-Regel)
let conflicts = Array.from({ length: 9 }, () =>
  Array.from({ length: 9 }, () => false)
);

// Kandidaten, die der Spieler ausgeblendet hat:
// hiddenCandidates[row][col][value] = true => diesen Kandidaten NICHT zeichnen
let hiddenCandidates = Array.from({ length: 9 }, () =>
  Array.from({ length: 9 }, () => Array(10).fill(false)) // Index 1..9
);

let selectedRow = 0;
let selectedCol = 0;

// Layout
let cellSize = 60;
let originX = 0;
let originY = 0;

// Kandidatenanzeige an/aus (Taste K)
let showCandidates = true;

// Editmodus für Kandidaten (Taste E) – wirkt nur, wenn showCandidates == true
let candidateEditMode = false;

// Hervorhebung einer Kandidatenzahl (1..9), null = keine
let highlightDigit = null;

// --- p5 Setup / Draw ----------------------------------------------------

function setup() {
  createCanvas(windowWidth, windowHeight); // volles Browserfenster
  textFont('monospace');
  updateLayout();
  noLoop();
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
  background(100); // dunkler Hintergrund

  drawGrid();
  drawCells();
  drawSelection();
  drawNumberPanel();
}

// --- Darstellung --------------------------------------------------------

function drawGrid() {
  stroke(0);
  for (let i = 0; i <= 9; i++) {
    strokeWeight(i % 3 === 0 ? 3 : 1);

    // Vertikale Linie
    line(originX + i * cellSize, originY,
         originX + i * cellSize, originY + 9 * cellSize);

    // Horizontale Linie
    line(originX, originY + i * cellSize,
         originX + 9 * cellSize, originY + i * cellSize);
  }
}

function drawCells() {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      let value = board[row][col];
      let { x, y } = cellToScreen(row, col);

      if (value !== 0) {
        // Zahl zeichnen
        if (conflicts[row][col]) {
          fill(255, 80, 80);
        } else {
          fill(240);
        }
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(cellSize * 0.6);
        text(value, x + cellSize / 2, y + cellSize / 2);
      } else if (showCandidates) {
        // Leeres Feld: Kandidaten zeichnen (wenn Kandidaten sichtbar)
        drawCandidates(row, col);
      }
    }
  }
}

function drawSelection() {
  let { x, y } = cellToScreen(selectedRow, selectedCol);
  noFill();
  stroke(0, 180, 255);
  strokeWeight(3);
  rect(x, y, cellSize, cellSize);
}

// Kandidaten in 3x3-Muster (Numpad-Layout: 1 unten links, 9 oben rechts)
function drawCandidates(row, col) {
  const candidates = getCandidates(row, col);
  if (candidates.length === 0) return;

  textAlign(CENTER, CENTER);
  const { x, y } = cellToScreen(row, col);

  for (let v of candidates) {
    if (hiddenCandidates[row][col][v]) continue;

    const idx = v - 1;
    const gridRow = 2 - floor(idx / 3); // 0 = oben, 2 = unten
    const gridCol = idx % 3;            // 0 = links, 2 = rechts

    const cx = x + (gridCol + 0.5) * (cellSize / 3);
    const cy = y + (gridRow + 0.5) * (cellSize / 3);

    // Hervorhebung
    if (highlightDigit === v) {
      fill(0, 150, 255);
      textSize(cellSize * 0.24);
    } else {
      fill(220);
      textSize(cellSize * 0.2);
    }

    noStroke();
    text(v, cx, cy);
  }
}

// Zahlenfeld 1..9 als 3x3-Quadrat, 1 unten links, 9 oben rechts
function drawNumberPanel() {
  const panelX = originX;
  const panelY = originY + 9 * cellSize + 30;

  textAlign(CENTER, CENTER);
  textSize(cellSize * 0.4);

  for (let v = 1; v <= 9; v++) {
    const idx = v - 1;
    const gridRow = 2 - floor(idx / 3); // 0..2 (oben bis unten)
    const gridCol = idx % 3;            // 0..2 (links bis rechts)

    const x = panelX + gridCol * cellSize;
    const y = panelY + gridRow * cellSize;

    if (highlightDigit === v) {
      fill(200, 220, 255);
    } else {
      fill(220);
    }
    stroke(0);
    strokeWeight(1);
    rect(x, y, cellSize, cellSize);

    fill(0);
    noStroke();
    text(v, x + cellSize / 2, y + cellSize / 2);
  }

  // Status-Text
  fill(255);
  textAlign(LEFT, TOP);
  textSize(16);

  const candText = showCandidates ? "Kandidaten: AN (K)" : "Kandidaten: AUS (K)";
  const editText = showCandidates
    ? (candidateEditMode ? "Edit: AN (E)" : "Edit: AUS (E)")
    : "Edit: AUS (E)";

  text(candText, originX, originY - 40);
  text(editText, originX, originY - 20);
}

// --- Eingabe: Maus & Tastatur ------------------------------------------

function mousePressed() {
  // 1) Klick ins Sudoku-Gitter?
  const cell = screenToCell(mouseX, mouseY);
  if (cell) {
    selectedRow = cell.row;
    selectedCol = cell.col;
    redraw();
    return;
  }

  // 2) Klick ins Zahlenfeld?
  const digit = panelHitTest(mouseX, mouseY);
  if (digit !== null) {
    if (highlightDigit === digit) {
      highlightDigit = null;
    } else {
      highlightDigit = digit;
    }
    redraw();
  }
}

function keyPressed() {
  // K: Kandidaten ein/aus
  if (key === 'k' || key === 'K') {
    showCandidates = !showCandidates;
    redraw();
    return;
  }

  // E: Editmodus ein/aus (nur sinnvoll, wenn Kandidaten sichtbar)
  if (key === 'e' || key === 'E') {
    if (showCandidates) {
      candidateEditMode = !candidateEditMode;
      redraw();
    }
    return;
  }

  // Pfeiltasten: Auswahl bewegen
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
    redraw();
    return;
  }

  // Ziffern 1..9
  if (key >= '1' && key <= '9') {
    const value = int(key);

    // Kandidaten bearbeiten nur, wenn:
    // - Kandidaten sichtbar
    // - Editmodus an
    // - Zelle leer
    if (showCandidates && candidateEditMode && board[selectedRow][selectedCol] === 0) {
      if (isValueAllowed(selectedRow, selectedCol, value)) {
        hiddenCandidates[selectedRow][selectedCol][value] =
          !hiddenCandidates[selectedRow][selectedCol][value];
      }
    } else {
      // sonst: normale Zahlsetzung
      board[selectedRow][selectedCol] = value;
      recomputeConflicts();
      for (let v = 1; v <= 9; v++) {
        hiddenCandidates[selectedRow][selectedCol][v] = false;
      }
    }

    redraw();
  }
}

// --- Hilfsfunktionen: Koordinaten & Panel ------------------------------

function screenToCell(px, py) {
  if (px < originX || px > originX + 9 * cellSize) return null;
  if (py < originY || py > originY + 9 * cellSize) return null;

  const col = floor((px - originX) / cellSize);
  const row = floor((py - originY) / cellSize);

  if (row < 0 || row > 8 || col < 0 || col > 8) return null;
  return { row, col };
}

function cellToScreen(row, col) {
  return {
    x: originX + col * cellSize,
    y: originY + row * cellSize
  };
}

// Test, ob ins Zahlenfeld (3x3) geklickt wurde
function panelHitTest(px, py) {
  const panelX = originX;
  const panelY = originY + 9 * cellSize + 30;
  const panelWidth = cellSize * 3;
  const panelHeight = cellSize * 3;

  if (px < panelX || px > panelX + panelWidth) return null;
  if (py < panelY || py > panelY + panelHeight) return null;

  const col = floor((px - panelX) / cellSize); // 0..2
  const row = floor((py - panelY) / cellSize); // 0..2 (0 = oben)

  if (col < 0 || col > 2 || row < 0 || row > 2) return null;

  // Numpad-Logik: 1 unten links, 9 oben rechts
  const digit = (2 - row) * 3 + col + 1;
  return digit;
}

// --- Sudoku-Logik -------------------------------------------------------

function recomputeConflicts() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      conflicts[r][c] = false;
    }
  }

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const value = board[r][c];
      if (value === 0) continue;

      if (!isCellValid(r, c, value)) {
        conflicts[r][c] = true;
      }
    }
  }
}

function isCellValid(row, col, value) {
  // Reihe
  for (let c = 0; c < 9; c++) {
    if (c === col) continue;
    if (board[row][c] === value) return false;
  }

  // Spalte
  for (let r = 0; r < 9; r++) {
    if (r === row) continue;
    if (board[r][col] === value) return false;
  }

  // Block
  const startRow = floor(row / 3) * 3;
  const startCol = floor(col / 3) * 3;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const rr = startRow + r;
      const cc = startCol + c;
      if (rr === row && cc === col) continue;
      if (board[rr][cc] === value) return false;
    }
  }

  return true;
}

function getCandidates(row, col) {
  if (board[row][col] !== 0) return [];

  const candidates = [];
  for (let value = 1; value <= 9; value++) {
    if (isValueAllowed(row, col, value)) {
      candidates.push(value);
    }
  }
  return candidates;
}

function isValueAllowed(row, col, value) {
  // Reihe
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === value) return false;
  }

  // Spalte
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === value) return false;
  }

  // Block
  const startRow = floor(row / 3) * 3;
  const startCol = floor(col / 3) * 3;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const rr = startRow + r;
      const cc = startCol + c;
      if (board[rr][cc] === value) return false;
    }
  }

  return true;
}
