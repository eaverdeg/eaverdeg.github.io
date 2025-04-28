const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const tileWidth = 80;
const tileHeight = 40;

const rows = 10;
const cols = 10;

let walls = []; // { x, y, dir: 'h' | 'v' }

function toScreen(x, y) {
  return {
    x: canvas.width / 2 + (x - y) * tileWidth / 2,
    y: 100 + (x + y) * tileHeight / 2
  };
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ccc';

  for (let x = 0; x <= cols; x++) {
    for (let y = 0; y <= rows; y++) {
      const p = toScreen(x, y);
      const right = toScreen(x + 1, y);
      const down = toScreen(x, y + 1);

      if (x < cols) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(right.x, right.y);
        ctx.stroke();
      }

      if (y < rows) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(down.x, down.y);
        ctx.stroke();
      }
    }
  }
}

function drawWalls() {
  ctx.fillStyle = '#000';
  const wallHeight = 60;

  walls.forEach(wall => {
    const baseStart = toScreen(wall.x, wall.y);
    const baseEnd = wall.dir === 'h'
      ? toScreen(wall.x + 1, wall.y)
      : toScreen(wall.x, wall.y + 1);

    const topStart = { x: baseStart.x, y: baseStart.y - wallHeight };
    const topEnd = { x: baseEnd.x, y: baseEnd.y - wallHeight };

    ctx.beginPath();
    ctx.moveTo(baseStart.x, baseStart.y);
    ctx.lineTo(topStart.x, topStart.y);
    ctx.lineTo(topEnd.x, topEnd.y);
    ctx.lineTo(baseEnd.x, baseEnd.y);
    ctx.closePath();
    ctx.fill();
  });
}

function render() {
  drawGrid();
  drawWalls();
}

canvas.addEventListener('click', (e) => {
  const clickX = e.offsetX;
  const clickY = e.offsetY;

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const base = toScreen(x, y);
      const right = toScreen(x + 1, y);
      const down = toScreen(x, y + 1);

      if (pointLineDist(clickX, clickY, base, right) < 10) {
        toggleWall(x, y, 'h');
        render();
        return;
      }

      if (pointLineDist(clickX, clickY, base, down) < 10) {
        toggleWall(x, y, 'v');
        render();
        return;
      }
    }
  }
});

function toggleWall(x, y, dir) {
  const index = walls.findIndex(w => w.x === x && w.y === y && w.dir === dir);
  if (index >= 0) {
    walls.splice(index, 1);
  } else {
    walls.push({ x, y, dir });
  }
}

function pointLineDist(px, py, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / lenSq));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(projX - px, projY - py);
}

render();
