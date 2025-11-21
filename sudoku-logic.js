// sudoku-logic.js
// -----------------------------
// Sudoku-Regeln, Konflikte, Kandidaten-Logik, Solver & Button-Funktionen
// Greift auf globale Variablen aus sketch.js zu: board, conflicts,
// hiddenCandidates, solverMessage, etc.

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

// prüft eine konkrete Zelle im aktuellen board
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
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

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

// Kandidaten für das aktuelle board (wird im UI benutzt)
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

// Wert hypothetisch prüfen (Zelle selbst ist 0) im aktuellen board
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
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const rr = startRow + r;
      const cc = startCol + c;
      if (board[rr][cc] === value) return false;
    }
  }

  return true;
}

// ---------- Solver auf beliebigem Board 'b' (Kopie) ----------

function isValueAllowedOn(b, row, col, value) {
  // Reihe
  for (let c = 0; c < 9; c++) {
    if (b[row][c] === value) return false;
  }

  // Spalte
  for (let r = 0; r < 9; r++) {
    if (b[r][col] === value) return false;
  }

  // Block
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const rr = startRow + r;
      const cc = startCol + c;
      if (b[rr][cc] === value) return false;
    }
  }

  return true;
}

// prüft Konsistenz eines (evtl. unvollständigen) Boards
function isBoardConsistentOn(b) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const value = b[r][c];
      if (value === 0) continue;

      b[r][c] = 0;
      const ok = isValueAllowedOn(b, r, c, value);
      b[r][c] = value;

      if (!ok) return false;
    }
  }
  return true;
}

// rekursiver Backtracking-Solver
function solveBoard(b) {
  let row = -1;
  let col = -1;
  let foundEmpty = false;

  for (let r = 0; r < 9 && !foundEmpty; r++) {
    for (let c = 0; c < 9 && !foundEmpty; c++) {
      if (b[r][c] === 0) {
        row = r;
        col = c;
        foundEmpty = true;
      }
    }
  }

  if (!foundEmpty) {
    return true; // fertig
  }

  for (let value = 1; value <= 9; value++) {
    if (isValueAllowedOn(b, row, col, value)) {
      b[row][col] = value;

      if (solveBoard(b)) {
        return true;
      }

      b[row][col] = 0; // backtrack
    }
  }

  return false; // Sackgasse
}

function isCurrentBoardSolvable() {
  const copy = board.map(row => row.slice());

  if (!isBoardConsistentOn(copy)) {
    return false;
  }
  return solveBoard(copy);
}

// ---------- Button-Funktionen (werden in index.html aufgerufen) ----------

function checkSolvable() {
  const copy = board.map(row => row.slice());
  if (!isBoardConsistentOn(copy)) {
    solverMessage = "Board ist inkonsistent (Regelverletzung).";
    redraw();
    return;
  }

  const solvable = solveBoard(copy);
  solverMessage = solvable
    ? "Das Sudoku ist lösbar."
    : "Für dieses Board gibt es keine Lösung.";
  redraw();
}

function solveCurrentBoard() {
  const copy = board.map(row => row.slice());

  if (!isBoardConsistentOn(copy)) {
    solverMessage = "Board ist inkonsistent – kann nicht gelöst werden.";
    redraw();
    return;
  }

  const ok = solveBoard(copy);
  if (!ok) {
    solverMessage = "Keine Lösung gefunden.";
    redraw();
    return;
  }

  // Lösung ins echte board übernehmen
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      board[r][c] = copy[r][c];
      // manuelle Kandidaten zurücksetzen
      for (let v = 1; v <= 9; v++) {
        hiddenCandidates[r][c][v] = false;
      }
    }
  }

  recomputeConflicts();
  solverMessage = "Sudoku gelöst.";
  redraw();
}
