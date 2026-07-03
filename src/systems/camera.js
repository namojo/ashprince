// 카메라 러프 팔로우 + 데드존. config.cameraLerp(0.1)·cameraDeadzone(0.4) 사용.
// 화면이 홱홱 움직이지 않도록 부드러운 추적, 중앙 데드존으로 잔걸음에 흔들리지 않게 한다.

export function setupCamera(scene, target, config, worldWidth, worldHeight) {
  const cam = scene.cameras.main;
  const lerp = config.cameraLerp ?? 0.1;
  cam.setBounds(0, 0, worldWidth, worldHeight);
  cam.startFollow(target, true, lerp, lerp); // roundPixels=true → 픽셀아트 도트 뭉개짐 방지
  const dz = config.cameraDeadzone ?? 0.4;
  cam.setDeadzone(cam.width * dz, cam.height * dz);
  cam.setRoundPixels(true);
  return cam;
}

// 챕터/맵 전환 시 부드러운 페이드. onDone 은 페이드 아웃 완료 시 호출(맵 교체 타이밍).
export function fadeTransition(scene, onOut, onIn) {
  const cam = scene.cameras.main;
  cam.fadeOut(300, 10, 10, 20);
  cam.once('camerafadeoutcomplete', () => {
    onOut && onOut();
    cam.fadeIn(300, 10, 10, 20);
    onIn && onIn();
  });
}
