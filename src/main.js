import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { UIScene } from './scenes/UIScene.js';

const config = {
  type: Phaser.AUTO,
  pixelArt: true,
  roundPixels: true,
  // 창 맞춤 확대 + 중앙 정렬(피드백 ⑥: 화면이 너무 작음). 800x600 종횡비 유지하며 창에 맞게 스케일.
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene, TitleScene, WorldScene, UIScene],
};

new Phaser.Game(config);
