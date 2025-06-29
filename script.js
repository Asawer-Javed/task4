// Loader & UI Initialization
window.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  const loaderCount = document.getElementById("loaderCount");
  const loaderProgress = document.getElementById("loaderProgress");
  const mainToolTop = document.querySelector(".main-tool-top");
  const themeSwitch = document.querySelector(".theme-switch-container");
  let count = 0;

  // Hide theme switch during loader
  if (themeSwitch) themeSwitch.style.display = "none";

  const interval = setInterval(() => {
    count++;
    loaderCount.textContent = `${count}%`;
    if (loaderProgress) loaderProgress.style.width = `${count}%`;
    if (count >= 100) {
      clearInterval(interval);
      loader.classList.add("hide");
      setTimeout(() => (loader.style.display = "none"), 500);
      if (themeSwitch) themeSwitch.style.display = "";
      if (mainToolTop) mainToolTop.classList.add("show-homepage");
      generateGrid();
    }
  }, 12);

  // Copy to clipboard functionality for code boxes
  const copyHtmlBtn = document.getElementById("copyHtmlBtn");
  const copyCssBtn = document.getElementById("copyCssBtn");
  const htmlCode = document.getElementById("htmlCode");
  const cssCode = document.getElementById("cssCode");

  if (copyHtmlBtn && htmlCode) {
    copyHtmlBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(htmlCode.value);
      copyHtmlBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
        copyHtmlBtn.innerHTML = '<i class="fas fa-copy"></i>';
      }, 1200);
    });
  }
  if (copyCssBtn && cssCode) {
    copyCssBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(cssCode.value);
      copyCssBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => {
        copyCssBtn.innerHTML = '<i class="fas fa-copy"></i>';
      }, 1200);
    });
  }
});

// Theme Toggle
function toggleTheme() {
  document.body.classList.toggle("dark");
}

// Grid Generation & Responsiveness
let isMouseDown = false;
let startCell = null;
let currentBlock = null;
let blocks = [];
let cellWidth = 0;
const cellHeight = 50;

window.addEventListener("resize", () => {
  const grid = document.getElementById("grid");
  if (!grid) return;
  const cols = parseInt(document.getElementById("cols").value);
  cellWidth = grid.clientWidth / cols;
  updateAllBlockPositions();
  updateCode();
});

function generateGrid() {
  const rows = parseInt(document.getElementById("rows").value);
  const cols = parseInt(document.getElementById("cols").value);
  const grid = document.getElementById("grid");

  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${rows}, ${cellHeight}px)`;

  for (let i = 0; i < rows * cols; i++) {
    const cell = document.createElement("div");
    cell.className = "grid-cell";
    cell.dataset.row = Math.floor(i / cols) + 1;
    cell.dataset.col = (i % cols) + 1;

    cell.addEventListener("mousedown", (e) => startDrag(e, cell));
    cell.addEventListener("mouseenter", (e) => continueDrag(e, cell));
    cell.addEventListener("touchstart", (e) => startDrag(e, cell), {
      passive: false,
    });
    cell.addEventListener("touchmove", (e) => continueDragTouch(e), {
      passive: false,
    });

    grid.appendChild(cell);
  }

  cellWidth = grid.clientWidth / cols;
  document.addEventListener("mouseup", endDrag);
  document.addEventListener("touchend", endDrag);

  clearBlocks();
  updateCode();
}

// Block Drag/Drop & Management
function startDrag(e, cell) {
  e.preventDefault();
  isMouseDown = true;
  startCell = cell;
  createBlock(cell, cell);
}

function continueDrag(e, cell) {
  if (!isMouseDown || !startCell || !currentBlock) return;
  e.preventDefault();

  const rows = parseInt(document.getElementById("rows").value);
  const cols = parseInt(document.getElementById("cols").value);

  const constrainedRow = Math.max(
    1,
    Math.min(rows, parseInt(cell.dataset.row))
  );
  const constrainedCol = Math.max(
    1,
    Math.min(cols, parseInt(cell.dataset.col))
  );

  let constrainedCell = cell;
  if (
    constrainedRow !== parseInt(cell.dataset.row) ||
    constrainedCol !== parseInt(cell.dataset.col)
  ) {
    constrainedCell = document.querySelector(
      `.grid-cell[data-row="${constrainedRow}"][data-col="${constrainedCol}"]`
    );
    if (!constrainedCell) return;
  }

  updateBlockDimensions(startCell, constrainedCell);
}

function continueDragTouch(e) {
  if (!isMouseDown || !startCell || !currentBlock) return;
  e.preventDefault();
  const touch = e.touches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  if (el && el.classList.contains("grid-cell")) {
    continueDrag(e, el);
  }
}

function endDrag() {
  isMouseDown = false;
  startCell = null;
  currentBlock = null;
}

function createBlock(startCell, endCell) {
  const block = document.createElement("div");
  block.className = "block";
  block.dataset.number = blocks.length + 1;

  // Store grid coordinates
  const rows = parseInt(document.getElementById("rows").value);
  const cols = parseInt(document.getElementById("cols").value);

  const r1 = Math.max(1, Math.min(rows, parseInt(startCell.dataset.row)));
  const c1 = Math.max(1, Math.min(cols, parseInt(startCell.dataset.col)));
  const r2 = Math.max(1, Math.min(rows, parseInt(endCell.dataset.row)));
  const c2 = Math.max(1, Math.min(cols, parseInt(endCell.dataset.col)));

  const rowStart = Math.min(r1, r2);
  const rowEnd = Math.max(r1, r2);
  const colStart = Math.min(c1, c2);
  const colEnd = Math.max(c1, c2);

  block.dataset.rowStart = rowStart;
  block.dataset.rowEnd = rowEnd;
  block.dataset.colStart = colStart;
  block.dataset.colEnd = colEnd;

  block.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    block.remove();
    blocks = blocks.filter((b) => b !== block);
    renumberBlocks();
    updateCode();
  });

  if (!updateBlockDimensionsFromCoords(block)) return;

  blocks.push(block);
  document.getElementById("grid").appendChild(block);
  currentBlock = block;
  updateCode();
}

function renumberBlocks() {
  blocks.forEach((block, index) => {
    block.dataset.number = index + 1;
    block.textContent = `Block ${index + 1}`;
  });
}

function updateBlockDimensionsFromCoords(block) {
  if (!block) return false;

  const rows = parseInt(document.getElementById("rows").value);
  const cols = parseInt(document.getElementById("cols").value);

  const rowStart = Math.max(
    1,
    Math.min(rows, parseInt(block.dataset.rowStart))
  );
  const rowEnd = Math.max(1, Math.min(rows, parseInt(block.dataset.rowEnd)));
  const colStart = Math.max(
    1,
    Math.min(cols, parseInt(block.dataset.colStart))
  );
  const colEnd = Math.max(1, Math.min(cols, parseInt(block.dataset.colEnd)));

  const left = (colStart - 1) * (cellWidth + 5);
  const width = (colEnd - colStart + 1) * (cellWidth + 5) - 5;
  const top = (rowStart - 1) * (cellHeight + 5);
  const height = (rowEnd - rowStart + 1) * (cellHeight + 5) - 5;

  // check for overlap
  for (const existingBlock of blocks) {
    if (existingBlock === block) continue;
    const existingLeft = parseFloat(existingBlock.style.left);
    const existingWidth = parseFloat(existingBlock.style.width);
    const existingTop = parseFloat(existingBlock.style.top);
    const existingHeight = parseFloat(existingBlock.style.height);
    if (
      !(
        left + width <= existingLeft ||
        left >= existingLeft + existingWidth ||
        top + height <= existingTop ||
        top >= existingTop + existingHeight
      )
    ) {
      return false;
    }
  }

  block.style.left = `${left}px`;
  block.style.width = `${width}px`;
  block.style.top = `${top}px`;
  block.style.height = `${height}px`;
  block.textContent = `Block ${block.dataset.number}`;
  return true;
}

function updateBlockDimensions(startCell, endCell, block = currentBlock) {
  if (!block) return false;

  const rows = parseInt(document.getElementById("rows").value);
  const cols = parseInt(document.getElementById("cols").value);

  const r1 = Math.max(1, Math.min(rows, parseInt(startCell.dataset.row)));
  const c1 = Math.max(1, Math.min(cols, parseInt(startCell.dataset.col)));
  const r2 = Math.max(1, Math.min(rows, parseInt(endCell.dataset.row)));
  const c2 = Math.max(1, Math.min(cols, parseInt(endCell.dataset.col)));

  const rowStart = Math.min(r1, r2);
  const rowEnd = Math.max(r1, r2);
  const colStart = Math.min(c1, c2);
  const colEnd = Math.max(c1, c2);

  block.dataset.rowStart = rowStart;
  block.dataset.rowEnd = rowEnd;
  block.dataset.colStart = colStart;
  block.dataset.colEnd = colEnd;

  return updateBlockDimensionsFromCoords(block);
}

function updateAllBlockPositions() {
  blocks.forEach((block) => updateBlockDimensionsFromCoords(block));
}

function clearBlocks() {
  blocks.forEach((b) => b.remove());
  blocks = [];
  updateCode();
}

// Code Output (HTML/CSS)
function updateCode() {
  const rows = document.getElementById("rows").value;
  const cols = document.getElementById("cols").value;

  let htmlCode = `<div class="grid-container">\n`;
  blocks.forEach((block) => {
    htmlCode += `  <div class="block" style="left: ${block.style.left}; width: ${block.style.width}; top: ${block.style.top}; height: ${block.style.height}">Block ${block.dataset.number}</div>\n`;
  });
  htmlCode += `</div>`;

  let cssCode = `.grid-container {\n`;
  cssCode += `  display: grid;\n`;
  cssCode += `  grid-template-rows: repeat(${rows}, ${cellHeight}px);\n`;
  cssCode += `  grid-template-columns: repeat(${cols}, 1fr);\n`;
  cssCode += `  gap: 5px;\n`;
  cssCode += `  width: 90%;\n`;
  cssCode += `  max-width: 600px;\n`;
  cssCode += `  margin: 20px auto;\n`;
  cssCode += `  position: relative;\n`;
  cssCode += `}\n\n`;
  cssCode += `.block {\n`;
  cssCode += `  background: #ffcccb;\n`;
  cssCode += `  border: 2px solid #ff9999;\n`;
  cssCode += `  font-weight: bold;\n`;
  cssCode += `  display: flex;\n`;
  cssCode += `  align-items: center;\n`;
  cssCode += `  justify-content: center;\n`;
  cssCode += `  position: absolute;\n`;
  cssCode += `  box-sizing: border-box;\n`;
  cssCode += `}\n`;

  document.getElementById("htmlCode").value = htmlCode;
  document.getElementById("cssCode").value = cssCode;
}
