// 8방향 가감속 이동. 즉발 최고속이 아니라 짧은 램프(config.moveAccelRamp 초)로 가감속하고,
// 대각선 입력을 정규화해 대각 이동이 빨라지지 않게 한다. (GDD balance §5: "젤다식 손맛")

export function createInput(scene) {
  const k = scene.input.keyboard;
  return {
    cursors: k.createCursorKeys(),
    wasd: k.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' }),
    interact: k.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    interactAlt: k.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    sight: k.addKey(Phaser.Input.Keyboard.KeyCodes.Q), // 통찰안(주변 상호작용 지점 강조)
  };
}

// 입력 → 정규화된 축 벡터 (-1..1). 대각선은 길이 1 로 정규화됨.
export function readAxis(input) {
  let x = 0, y = 0;
  if (input.cursors.left.isDown || input.wasd.left.isDown) x -= 1;
  if (input.cursors.right.isDown || input.wasd.right.isDown) x += 1;
  if (input.cursors.up.isDown || input.wasd.up.isDown) y -= 1;
  if (input.cursors.down.isDown || input.wasd.down.isDown) y += 1;
  if (x !== 0 && y !== 0) { const inv = 1 / Math.SQRT2; x *= inv; y *= inv; }
  return { x, y };
}

// 현재 속도를 목표 속도로 accelRate 만큼 접근시킨다(선형 램프). dtSec = 프레임 시간(초).
export function applyMovement(body, axis, opts, dtSec) {
  const speed = opts.speed;
  const accelRate = speed / Math.max(opts.rampTime, 0.001); // px/s^2
  const targetVx = axis.x * speed, targetVy = axis.y * speed;
  const step = accelRate * dtSec;
  body.velocity.x = approach(body.velocity.x, targetVx, step);
  body.velocity.y = approach(body.velocity.y, targetVy, step);
  const moving = axis.x !== 0 || axis.y !== 0;
  return { moving, vx: body.velocity.x, vy: body.velocity.y };
}

function approach(cur, target, maxStep) {
  const d = target - cur;
  if (Math.abs(d) <= maxStep) return target;
  return cur + Math.sign(d) * maxStep;
}
