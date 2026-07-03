// 데이터 주도 애니메이션. 프레임 인덱스를 코드에 직접 쓰지 않고 스프라이트 사이드카(또는
// 플레이스홀더 spec)의 프레임 매핑에서 walk/idle 애니메이션 키를 생성한다.
// 프레임 규약: row-per-direction, 정수 인덱스 = row*framesPerDir + col (placeholders.js 와 동일).

// 사이드카(또는 기본 spec)로 방향별 walk/idle 애니메이션을 등록한다.
// spec = { directions:[...], framesPerDir, frameRate, idleFrameIndex }
export function buildCharacterAnims(scene, key, spec) {
  const dirs = spec.directions, cols = spec.framesPerDir;
  dirs.forEach((dir, row) => {
    const base = row * cols;
    const walkKey = `${key}-walk-${dir}`;
    if (!scene.anims.exists(walkKey)) {
      scene.anims.create({
        key: walkKey,
        frames: range(base, cols).map(i => ({ key, frame: i })),
        frameRate: spec.frameRate ?? 8,
        repeat: -1,
      });
    }
    const idleKey = `${key}-idle-${dir}`;
    if (!scene.anims.exists(idleKey)) {
      scene.anims.create({
        key: idleKey,
        frames: [{ key, frame: base + (spec.idleFrameIndex ?? 0) }],
        frameRate: 1,
      });
    }
  });
}

// 사이드카 JSON → 내부 spec. 부재/불일치 시 기본값으로 폴백(스텁).
export function specFromSidecar(sidecar) {
  if (!sidecar) return defaultSpec();
  return {
    directions: sidecar.directions || DEFAULT_DIRS,
    framesPerDir: sidecar.walk?.framesPerDir ?? 4,
    frameRate: sidecar.walk?.frameRate ?? 8,
    idleFrameIndex: sidecar.idle?.frameIndex ?? 0,
  };
}

export function defaultSpec() {
  return { directions: DEFAULT_DIRS, framesPerDir: 4, frameRate: 8, idleFrameIndex: 0 };
}

const DEFAULT_DIRS = ['down', 'left', 'right', 'up'];

// 속도 벡터 → 사용 가능한 방향 중 가장 가까운 방향 키. 정지 시 lastDir 유지.
export function dirFromVector(vx, vy, availableDirs, lastDir) {
  if (Math.abs(vx) < 1 && Math.abs(vy) < 1) return lastDir;
  // 8방향 각도 → 방향명
  const ang = Math.atan2(vy, vx); // -PI..PI, x+ 오른쪽, y+ 아래
  const eight = angleToDir(ang);
  if (availableDirs.includes(eight)) return eight;
  // 8방향 시트가 아니면 4방향으로 스냅 (우세 축).
  if (Math.abs(vx) > Math.abs(vy)) return vx > 0 ? 'right' : 'left';
  return vy > 0 ? 'down' : 'up';
}

function angleToDir(ang) {
  const deg = (Phaser.Math.RadToDeg(ang) + 360) % 360;
  const names = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'];
  return names[Math.round(deg / 45) % 8];
}

function range(start, n) { return Array.from({ length: n }, (_, i) => start + i); }
