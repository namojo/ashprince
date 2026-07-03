// 배열 기반 코드 타일맵 + 레벨 페인팅. Tiled 없이 실물 타일셋의 여러 타일을 활용해
// 바닥 변주·벽 변주·벽에 붙는 장식 소품을 결정적으로 배치하고, 충돌 집합 기반으로
// 도달성(flood fill)을 계산해 오브젝트가 벽에 막힌 곳에 놓이지 않게 한다.
//
// descriptor(맵별, BootScene 생성): {
//   key, collision:[...], collisionSet:Set,
//   floorBase, groundVariants:[...], wallMain, wallAlt, collideProps:[...], floorDecor:[...] }

// 실물 타일 인덱스 2D 그리드를 그린다. spawnTile 주변은 바닥으로 비워 시작 지점을 보장한다.
export function generateMapData(descriptor, w, h, chapter, spawnTile) {
  const d = descriptor;
  const rnd = lcg((chapter + 1) * 9301 + w * 49297 + h);
  const g = Array.from({ length: h }, () => Array.from({ length: w }, () => paintFloor(d, rnd)));

  // 테두리 벽(변주).
  for (let x = 0; x < w; x++) { g[0][x] = wall(d, rnd); g[h - 1][x] = wall(d, rnd); }
  for (let y = 0; y < h; y++) { g[y][0] = wall(d, rnd); g[y][w - 1] = wall(d, rnd); }

  // 챕터별 내부 파티션(문 통로 포함). chapter 0 = 회상 소형 방(파티션 없음).
  const doorways = [];
  partitions(g, w, h, chapter, d, doorways, rnd);

  // 시작 지점 주변 3x3 바닥 확보.
  if (spawnTile) clearAround(g, w, h, spawnTile.x, spawnTile.y, d.floorBase);

  // 벽에 붙는 장식 소품(충돌). 통로/시작점을 막지 않도록 벽 인접 바닥에만 드물게.
  if (chapter !== 0 && d.collideProps.length) placeProps(g, w, h, d, doorways, rnd);

  return g;
}

// 실물/플레이스홀더 그리드로 Phaser 타일맵/레이어 생성 + 충돌 설정.
export function buildTilemap(scene, grid, tileSize, descriptor) {
  const map = scene.make.tilemap({ data: grid, tileWidth: tileSize, tileHeight: tileSize });
  const tileset = map.addTilesetImage(descriptor.key, descriptor.key, tileSize, tileSize, 0, 0);
  const layer = map.createLayer(0, tileset, 0, 0);
  layer.setCollision(descriptor.collision && descriptor.collision.length ? descriptor.collision : [descriptor.wallMain]);
  return { map, layer, worldWidth: map.widthInPixels, worldHeight: map.heightInPixels };
}

// 시작 타일에서 걷기 가능 셀로 flood fill → 도달 가능 셀 집합("x,y").
export function computeReachable(grid, collisionSet, sx, sy) {
  const h = grid.length, w = grid[0].length;
  const walk = (x, y) => x >= 0 && y >= 0 && x < w && y < h && !collisionSet.has(grid[y][x]);
  let start = [sx, sy];
  if (!walk(sx, sy)) { const n = nearestWalkable(grid, collisionSet, sx, sy); start = [n.x, n.y]; }
  const seen = new Set(), stack = [start];
  while (stack.length) {
    const [x, y] = stack.pop(), k = x + ',' + y;
    if (seen.has(k) || !walk(x, y)) continue;
    seen.add(k);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return seen;
}

// 도달 가능한 걷기 셀을 공간 버킷으로 고루 분산해 count 개 선택(오브젝트 배치용).
export function scatterWalkable(grid, tileSize, count, collisionSet, reachable, avoid, seed) {
  const h = grid.length, w = grid[0].length;
  const avoidSet = new Set(avoid.map(a => a.x + ',' + a.y));
  const cells = [];
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const k = x + ',' + y;
      if (!collisionSet.has(grid[y][x]) && reachable.has(k) && !avoidSet.has(k)) cells.push({ x, y });
    }
  if (!cells.length || !count) return [];
  // 공간 버킷(대략 count 개 구획)으로 나눠 구획마다 하나씩 → 방마다 흩어진 배치감.
  const rnd = lcg(seed >>> 0);
  const cols = Math.ceil(Math.sqrt(count)), rows = Math.ceil(count / cols);
  const buckets = Array.from({ length: cols * rows }, () => []);
  for (const c of cells) {
    const bx = Math.min(cols - 1, Math.floor((c.x / w) * cols));
    const by = Math.min(rows - 1, Math.floor((c.y / h) * rows));
    buckets[by * cols + bx].push(c);
  }
  const picked = [];
  for (let i = 0; i < buckets.length && picked.length < count; i++) {
    const b = buckets[i];
    if (b.length) picked.push(b[Math.floor(rnd() * b.length)]);
  }
  let guard = 0;
  while (picked.length < count && guard++ < cells.length * 2) {
    const c = cells[Math.floor(rnd() * cells.length)];
    if (!picked.includes(c)) picked.push(c);
  }
  return picked.slice(0, count).map(t => ({
    tx: t.x, ty: t.y, px: t.x * tileSize + tileSize / 2, py: t.y * tileSize + tileSize / 2,
  }));
}

// 지정 타일에서 가장 가까운 걷기 가능 셀.
export function nearestWalkable(grid, collisionSet, tx, ty) {
  const h = grid.length, w = grid[0].length;
  const ok = (x, y) => x > 0 && y > 0 && x < w - 1 && y < h - 1 && !collisionSet.has(grid[y][x]);
  if (ok(tx, ty)) return { x: tx, y: ty };
  for (let r = 1; r < Math.max(w, h); r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const x = tx + dx, y = ty + dy;
        if (ok(x, y)) return { x, y };
      }
  return { x: 1, y: 1 };
}

// ── 페인팅 헬퍼 ──────────────────────────────────────────
function paintFloor(d, rnd) {
  const r = rnd();
  if (d.floorDecor.length && r < 0.05) return d.floorDecor[Math.floor(rnd() * d.floorDecor.length)];
  if (d.groundVariants.length && r < 0.28) return d.groundVariants[Math.floor(rnd() * d.groundVariants.length)];
  return d.floorBase;
}
function wall(d, rnd) { return (d.wallAlt !== d.wallMain && rnd() < 0.18) ? d.wallAlt : d.wallMain; }

function partitions(g, w, h, chapter, d, doorways, rnd) {
  const setWall = (x, y) => { g[y][x] = wall(d, rnd); };
  if (chapter === 1) {
    vline(g, Math.floor(w * 0.55), 1, h - 2, Math.floor(h * 0.4), setWall, doorways);
    hline(g, 1, w - 2, Math.floor(h * 0.5), Math.floor(w * 0.25), setWall, doorways);
  } else if (chapter === 2) {
    vline(g, Math.floor(w * 0.33), 1, h - 2, Math.floor(h * 0.5), setWall, doorways);
    vline(g, Math.floor(w * 0.66), 1, h - 2, Math.floor(h * 0.3), setWall, doorways);
    const ry = Math.floor(h * 0.5);
    for (const gx of [Math.floor(w * 0.16), Math.floor(w * 0.5), Math.floor(w * 0.83)])
      hline(g, 1, w - 2, ry, gx, setWall, doorways);
  } else if (chapter === 3) {
    for (const frac of [0.28, 0.52, 0.76]) {
      const ry = Math.floor(h * frac);
      hline(g, 1, w - 2, ry, Math.floor(w * (ry % 2 ? 0.3 : 0.7)), setWall, doorways);
    }
  }
}
// 세로 벽(문 통로 2칸 gapY, gapY+1).
function vline(g, col, r1, r2, gapY, setWall, doorways) {
  for (let y = r1; y <= r2; y++) {
    if (y === gapY || y === gapY + 1) { doorways.push({ x: col, y }); continue; }
    setWall(col, y);
  }
}
function hline(g, c1, c2, row, gapX, setWall, doorways) {
  for (let x = c1; x <= c2; x++) {
    if (x === gapX || x === gapX + 1) { doorways.push({ x, y: row }); continue; }
    setWall(x, row);
  }
}

function clearAround(g, w, h, cx, cy, floor) {
  for (let y = cy - 1; y <= cy + 1; y++)
    for (let x = cx - 1; x <= cx + 1; x++)
      if (x > 0 && y > 0 && x < w - 1 && y < h - 1) g[y][x] = floor;
}

// 벽에 인접한 바닥 셀에만 드물게 소품 배치(통로·문 인접 제외) → 동선 훼손 최소화.
function placeProps(g, w, h, d, doorways, rnd) {
  const doorSet = new Set(doorways.flatMap(dw => [
    dw.x + ',' + dw.y, (dw.x + 1) + ',' + dw.y, (dw.x - 1) + ',' + dw.y,
    dw.x + ',' + (dw.y + 1), dw.x + ',' + (dw.y - 1)]));
  const isWall = (x, y) => d.collisionSet.has(g[y][x]);
  for (let y = 2; y < h - 2; y++)
    for (let x = 2; x < w - 2; x++) {
      if (d.collisionSet.has(g[y][x]) || doorSet.has(x + ',' + y)) continue;
      const touchesWall = isWall(x - 1, y) || isWall(x + 1, y) || isWall(x, y - 1) || isWall(x, y + 1);
      if (touchesWall && rnd() < 0.16) g[y][x] = d.collideProps[Math.floor(rnd() * d.collideProps.length)];
    }
}

// 결정적 난수(LCG).
function lcg(seed) {
  let s = (seed >>> 0) || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
