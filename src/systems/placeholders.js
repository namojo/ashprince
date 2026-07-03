// 코드 생성 플레이스홀더 텍스처. 스프라이트 엔지니어의 실물 에셋 도착 전까지 사용.
// 실물 매니페스트 수신 후 BootScene 에서 실제 로드로 교체된다(플레이스홀더 미생성 분기).
//
// 프레임 규약: 캐릭터 시트는 row-per-direction 격자. 프레임 정수 인덱스 = row*cols + col.
// 이는 load.spritesheet 로 로드된 실물 시트의 정수 인덱스 규약과 동일 → animation.js 가 양쪽을 동일 취급.

export function makePlaceholderCharacter(scene, key, opts) {
  const fw = opts.frameWidth, fh = opts.frameHeight;
  const dirs = opts.directions;      // ["down","left","right","up"]
  const cols = opts.framesPerDir, rows = dirs.length;
  const color = opts.color;

  const tex = scene.textures.createCanvas(key, fw * cols, fh * rows);
  const ctx = tex.getContext();
  const arrow = { down: '▼', up: '▲', left: '◀', right: '▶',
                  'down-left': '◣', 'down-right': '◢', 'up-left': '◤', 'up-right': '◥' };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * fw, y = r * fh;
      const bob = (c % 2 === 0) ? 0 : 2;
      ctx.fillStyle = color;
      ctx.fillRect(x + 10, y + 14 + bob, fw - 20, fh - 26);            // 몸통
      ctx.fillStyle = '#f2e6d0';
      ctx.beginPath();
      ctx.arc(x + fw / 2, y + 12 + bob, 9, 0, Math.PI * 2);
      ctx.fill();                                                        // 머리
      ctx.fillStyle = '#2a2a3a';
      const swing = (c === 1) ? -3 : (c === 3 ? 3 : 0);
      ctx.fillRect(x + 14 + swing, y + fh - 12, 6, 10);
      ctx.fillRect(x + fw - 20 - swing, y + fh - 12, 6, 10);             // 다리
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(arrow[dirs[r]] || '?', x + fw / 2, y + fh / 2 + 4);
      // 정수 인덱스 프레임 등록 (row-major)
      tex.add(r * cols + c, 0, x, y, fw, fh);
    }
  }
  tex.refresh();
}

// 플레이스홀더 타일셋: 논리 인덱스별 색상 타일(가로 배열). addTilesetImage 가 tileSize 로 자동 슬라이스.
export const TILE = { FLOOR: 0, WALL: 1, DOOR: 2, ECHO: 3, DECOR: 4, FB_FLOOR: 5, GOAL: 6, HAZARD: 7 };
const TILE_COLORS = ['#3b3b4d', '#6b6b52', '#8a6d3b', '#4a6d8a', '#4d4d40', '#2e2e44', '#3b6b4d', '#7a3b3b'];

export function makePlaceholderTileset(scene, key, tileSize) {
  const n = TILE_COLORS.length;
  const tex = scene.textures.createCanvas(key, tileSize * n, tileSize);
  const ctx = tex.getContext();
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = TILE_COLORS[i];
    ctx.fillRect(i * tileSize, 0, tileSize, tileSize);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.strokeRect(i * tileSize + 0.5, 0.5, tileSize - 1, tileSize - 1);
  }
  tex.refresh();
  return n;
}

// 오브젝트/NPC/에코 마커용 단색 원형 텍스처(그래픽 → 텍스처).
export function makeMarker(scene, key, color, size = 40) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x000000, 0.35); g.fillCircle(size / 2, size / 2 + 3, size / 2 - 2);
  g.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
  g.fillCircle(size / 2, size / 2, size / 2 - 3);
  g.lineStyle(2, 0xffffff, 0.85);
  g.strokeCircle(size / 2, size / 2, size / 2 - 3);
  g.generateTexture(key, size, size);
  g.destroy();
}
