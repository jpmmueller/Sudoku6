// sudoku-ui.js
// -----------------------------
// Zeichnen des Grids, Zellen, Kandidaten, Panel
// Hilfsfunktionen für Koordinaten & Klicks

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
      const value = board[row][col];
      const { x, y } = cellToScreen(row, col);

      if (value !== 0) {
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
        drawCandidates(row, col);
      }
    }
  }
}

function drawSelection() {
  const { x, y } = cellToScreen(selectedRow, selectedCol);
  noFill();
  stroke(0, 180, 255);
  strokeWeight(3);
  rect(x, y, cellSize, cellSize);
}

// Kandidaten in Numpad-Anordnung (1 unten links, 9 oben rechts)
function drawCandidates(row, col) {
  const candidates = getCandidates(row, col);
  if (candidates.length === 0) return;

  textAlign(CENTER, CENTER);
  const { x, y } = cellToScreen(row, col);

  for (let v of candidates) {
    if (hiddenCandidates[row][col][v]) continue;

    const idx = v - 1;
    const gridRow = 2 - Math.floor(idx / 3); // 0 = oben, 2 = unten
    const gridCol = idx % 3;                 // 0 = links, 2 = rechts

    const cx = x + (gridCol + 0.5) * (cellSize / 3);
    const cy = y + (gridRow + 0.5) * (cellSize / 3);

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

// Panel mit 1..9 (3x3-Block) + Statusanzeige
function drawNumberPanel() {
  const panelX = originX;
  const panelY = originY + 9 * cellSize + 30;

  textAlign(CENTER, CENTER);
  textSize(cellSize * 0.4);

  for (let v = 1; v <= 9; v++) {
    const idx = v - 1;
    const gridRow = 2 - Math.floor(idx / 3); // 0..2
    const gridCol = idx % 3;                 // 0..2

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

  // Status oben
  fill(255);
  textAlign(LEFT, TOP);
  textSize(16);

  const candText = showCandidates ? "Kandidaten: AN (K)" : "Kandidaten: AUS (K)";
  const editText = showCandidates
    ? (candidateEditMode ? "Editmodus: AN (E)" : "Editmodus: AUS (E)")
    : "Editmodus: AUS (E)";

  text(candText, originX, originY - 40);
  text(editText, originX, originY - 20);

  // Solver-Status (unter dem Panel)
  if (solverMessage && solverMessage.length > 0) {
    textAlign(LEFT, TOP);
    textSize(14);
    text(solverMessage, panelX + cellSize * 3 + 20, panelY);
  }
}

// Koordinaten-Helfer

function screenToCell(px, py) {
  if (px < originX || px > originX + 9 * cellSize) return null;
  if (py < originY || py > originY + 9 * cellSize) return null;

  const col = Math.floor((px - originX) / cellSize);
  const row = Math.floor((py - originY) / cellSize);

  if (row < 0 || row > 8 || col < 0 || col > 8) return null;
  return { row, col };
}

function cellToScreen(row, col) {
  return {
    x: originX + col * cellSize,
    y: originY + row * cellSize
  };
}

// Klick ins Zahlenpanel (3x3)
function panelHitTest(px, py) {
  const panelX = originX;
  const panelY = originY + 9 * cellSize + 30;
  const panelWidth = cellSize * 3;
  const panelHeight = cellSize * 3;

  if (px < panelX || px > panelX + panelWidth) return null;
  if (py < panelY || py > panelY + panelHeight) return null;

  const col = Math.floor((px - panelX) / cellSize); // 0..2
  const row = Math.floor((py - panelY) / cellSize); // 0..2

  if (col < 0 || col > 2 || row < 0 || row > 2) return null;

  // Numpad-Logik: 1 unten links, 9 oben rechts
  const digit = (2 - row) * 3 + col + 1;
  return digit;
}
