const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');

const gridSize = 10; // number of squares per side
const unit = 40; // 40 cm per square
const tileWidth = unit;
const tileHeight = unit / 2;
const heightUnit = tileHeight; // vertical scale per 40 cm

let orientation = 0; // 0 or 90 degrees
let mode = null; // current action
const panels = [];

function isoToScreen(x, y) {
  return {
    x: (x - y) * tileWidth / 2 + canvas.width / 2,
    y: (x + y) * tileHeight / 2
  };
}

function screenToIso(sx, sy) {
  const cx = sx - canvas.width / 2;
  const a = cx / (tileWidth / 2);
  const b = sy / (tileHeight / 2);
  const x = (a + b) / 2;
  const y = b - x;
  return { x, y };
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ADD8E6';
  for (let i = 0; i <= gridSize; i++) {
    let a = isoToScreen(i, 0);
    let b = isoToScreen(i, gridSize);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    a = isoToScreen(0, i);
    b = isoToScreen(gridSize, i);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  panels.forEach(drawPanel);
}

function drawEdge(base, h) {
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(base.x, base.y - h);
  ctx.stroke();
  [0, h / 2, h].forEach(pos => {
    ctx.beginPath();
    ctx.arc(base.x, base.y - pos, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPanel(p) {
  ctx.strokeStyle = '#8B0000';
  ctx.fillStyle = '#8B0000';
  const h = 5 * heightUnit; // 200 cm height
  let base1, base2;
  if (p.orientation === 0) {
    base1 = isoToScreen(p.x, p.y);
    base2 = isoToScreen(p.x + p.length, p.y);
  } else {
    base1 = isoToScreen(p.x, p.y);
    base2 = isoToScreen(p.x, p.y + p.length);
  }
  drawEdge(base1, h);
  drawEdge(base2, h);
  ctx.beginPath();
  ctx.moveTo(base1.x, base1.y - h);
  ctx.lineTo(base2.x, base2.y - h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(base1.x, base1.y);
  ctx.lineTo(base2.x, base2.y);
  ctx.stroke();
}

document.getElementById('add40').onclick = () => { mode = 'add40'; };
document.getElementById('add80').onclick = () => { mode = 'add80'; };
document.getElementById('remove').onclick = () => { mode = 'remove'; };
document.getElementById('rotate').onclick = () => {
  orientation = orientation === 0 ? 90 : 0;
  document.getElementById('orientationDisplay').textContent = `Orientation: ${orientation}°`;
};

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;
  const iso = screenToIso(sx, sy);
  const gx = Math.floor(iso.x);
  const gy = Math.floor(iso.y);
  if (mode === 'add40' || mode === 'add80') {
    const length = mode === 'add40' ? 1 : 2;
    panels.push({ x: gx, y: gy, length, orientation });
    drawGrid();
  } else if (mode === 'remove') {
    const idx = panels.findIndex(p => {
      if (p.orientation === 0) {
        return gy === p.y && gx >= p.x && gx < p.x + p.length;
      } else {
        return gx === p.x && gy >= p.y && gy < p.y + p.length;
      }
    });
    if (idx >= 0) {
      panels.splice(idx, 1);
      drawGrid();
    }
  }
});

drawGrid();
