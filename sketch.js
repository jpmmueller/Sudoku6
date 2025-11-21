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

let selectedRow = 0;
let selectedCol = 0;

let originX = 500;
let originY = 300;
let cellSize = 65;

// Kandidatenmodus: true = anzeigen, false = ausblenden
let showCandidates = true;

// --- p5 Setup / Draw ----------------------------------------------------

function setup() {
  createCanvas(1100, 1000);
  textFont('monospace');
  noLoop();
}

function draw() {
  background(240);

  drawGrid();
  drawCells();
  drawSelection();
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
          fill(255, 0, 0);
        } else {
          fill(0);
        }
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(cellSize * 0.6);
        text(value, x + cellSize / 2, y + cellSize / 2);
      } else if (showCandidates) {
        // Leeres Feld: Kandidaten zeichnen
        drawCandidates(row, col);
      }
    }
  }
}

function drawSelection() {
  let { x, y } = cellToScreen(selectedRow, selectedCol);
  noFill();
  stroke(0, 0, 255);
  strokeWeight(3);
  rect(x, y, cellSize, cellSize);
}

// --- Kandidaten --------------------------------------------------------

function drawCandidates(row, col) {
  const candidates = getCandidates(row, col);
  if (candidates.length === 0) return;

  fill(80);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(cellSize * 0.2);

  const { x, y } = cellToScreen(row, col);

  for (let v of candidates) {
    // v: 1..9 → in 3x3-Raster umrechnen
    const index = v - 1;              // 0..8
    const gridRow = floor(index / 3); // 0..2
    const gridCol = index % 3;        // 0..2

    // Position innerhalb der Zelle
    const cx = x + (gridCol + 0.5) * (cellSize / 3);
    const cy = y + (gridRow + 0.5) * (cellSize / 3);

    text(v, cx, cy);
  }
}

// --- Eingabe: Maus & Tastatur ------------------------------------------

function mousePressed() {
  const cell = screenToCell(mouseX, mouseY);
  if (!cell) return;

  selectedRow = cell.row;
  selectedCol = cell.col;
  redraw();
}

function keyPressed() {
  // Kandidatenmodus umschalten mit K
  if (key === 'k' || key === 'K') {
    showCandidates = !showCandidates;
    redraw();
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
    redraw();
    return;
  }

  // Zahl 1..9 eingeben
  if (key >= '1' && key <= '9') {
    const value = int(key);
    board[selectedRow][selectedCol] = value;
    recomputeConflicts();
    redraw();
  }
}

// --- Hilfsfunktionen: Koordinaten --------------------------------------

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

// --- Sudoku-Logik -------------------------------------------------------

function recomputeConflicts() {
  // Konflikte zurücksetzen
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      conflicts[r][c] = false;
    }
  }

  // Jede belegte Zelle prüfen
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

// liefert alle Werte 1..9, die an (row, col) möglich sind
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
