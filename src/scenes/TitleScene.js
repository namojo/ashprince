// 타이틀 화면. "잿빛 여명" 톤 그라데이션 + 떠도는 안개 코드 연출 + 타이틀 타이포 + 시작 버튼.
// 배경 일러스트(sprite-engineer 생산 예정, manifest.title) 도착 시 이미지로 교체. 도착 전엔 코드 연출.
// 시작 클릭 → World 진입(World 가 인트로 스토리 패널을 재생).

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    // dev 모드: 타이틀을 건너뛰고 바로 World 진입(스모크/QA 편의).
    if (window.location.search.includes('dev=1')) { this.scene.start('World', { fromTitle: true }); return; }
    const { width: W, height: H } = this.scale;
    const manifest = this.registry.get('manifest');
    const titleImg = manifest && manifest.title;

    if (titleImg && this.textures.exists('title_bg')) {
      this.add.image(W / 2, H / 2, 'title_bg').setDisplaySize(W, H);
      // 배경 일러스트가 화려해도 타이포·버튼·안내가 읽히도록 은은한 어두운 스크림(비네트).
      this._addLegibilityScrim(W, H);
    } else {
      this._paintAshenDawn(W, H); // 코드 연출 폴백
    }

    // 타이틀 타이포(잿빛 여명: 빛바랜 라벤더그레이, 은은한 그림자).
    const title = this.add.text(W / 2, H * 0.34, '재의 군주', {
      fontFamily: 'Georgia, serif', fontSize: '64px', color: '#e8e2f0',
      stroke: '#2a2438', strokeThickness: 6,
    }).setOrigin(0.5).setShadow(0, 4, '#1a1626', 12, true, true);
    this.add.text(W / 2, H * 0.34 + 58, '기원담', {
      fontFamily: 'Georgia, serif', fontSize: '30px', color: '#b9aed0', letterSpacing: 8,
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.34 + 100, '어느 어둠 마법사의 시작에 관하여', {
      fontFamily: 'Georgia, serif', fontSize: '15px', color: '#8a82a0', fontStyle: 'italic',
    }).setOrigin(0.5);

    // 타이틀 은은한 부유.
    this.tweens.add({ targets: title, y: title.y - 6, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this._makeStartButton(W / 2, H * 0.72);

    // 접근성: Enter/Space 로도 시작, F 로 전체화면 토글.
    this.input.keyboard.once('keydown-ENTER', () => this._start());
    this.input.keyboard.once('keydown-SPACE', () => this._start());
    this.input.keyboard.on('keydown-F', () => this.scale.toggleFullscreen());

    this.add.text(W / 2, H - 24, 'Enter/시작 클릭 · F 전체화면 · WASD/화살표 이동 · E 조사 · B 추리 보드', {
      fontFamily: 'Georgia, serif', fontSize: '12px', color: '#6a6280',
    }).setOrigin(0.5);
  }

  _makeStartButton(x, y) {
    const w = 200, h = 56;
    const g = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x2a2438, 0.85).setStrokeStyle(2, 0xb9aed0, 0.9);
    const label = this.add.text(0, 0, '시 작', {
      fontFamily: 'Georgia, serif', fontSize: '24px', color: '#e8e2f0', letterSpacing: 6,
    }).setOrigin(0.5);
    g.add([bg, label]);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => { bg.setFillStyle(0x3a3450, 0.95); label.setColor('#ffffff'); });
    bg.on('pointerout', () => { bg.setFillStyle(0x2a2438, 0.85); label.setColor('#e8e2f0'); });
    bg.on('pointerdown', () => this._start());
    this.tweens.add({ targets: g, alpha: { from: 0.75, to: 1 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  _start() {
    if (this._started) return; this._started = true;
    this.cameras.main.fadeOut(500, 10, 10, 22);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('World', { fromTitle: true }));
  }

  // 타이포/버튼 가독성용 스크림: 상단 타이틀대와 하단 안내에 은은한 세로 어둠(중앙은 투명).
  _addLegibilityScrim(W, H) {
    const tex = this.textures.createCanvas('title_scrim', W, H);
    const ctx = tex.getContext();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(16,14,26,0.55)');
    grad.addColorStop(0.32, 'rgba(16,14,26,0.30)');
    grad.addColorStop(0.55, 'rgba(16,14,26,0.12)');
    grad.addColorStop(0.80, 'rgba(16,14,26,0.42)');
    grad.addColorStop(1, 'rgba(16,14,26,0.72)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    tex.refresh();
    this.add.image(0, 0, 'title_scrim').setOrigin(0);
  }

  // 잿빛 여명 그라데이션 + 떠도는 안개 위스프(원경 페이드).
  _paintAshenDawn(W, H) {
    const tex = this.textures.createCanvas('title_grad', W, H);
    const ctx = tex.getContext();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#3a3450'); grad.addColorStop(0.5, '#2a2740'); grad.addColorStop(1, '#1a1626');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    tex.refresh();
    this.add.image(0, 0, 'title_grad').setOrigin(0);

    // 안개 위스프: 반투명 흰 타원 여러 개가 천천히 흐른다.
    for (let i = 0; i < 7; i++) {
      const fog = this.add.ellipse(
        Phaser.Math.Between(0, W), Phaser.Math.Between(H * 0.4, H),
        Phaser.Math.Between(180, 340), Phaser.Math.Between(60, 120),
        0xc9c2d6, Phaser.Math.FloatBetween(0.04, 0.10));
      this.tweens.add({
        targets: fog, x: fog.x + Phaser.Math.Between(-120, 120),
        duration: Phaser.Math.Between(9000, 16000), yoyo: true, repeat: -1, ease: 'Sine.inOut',
      });
    }
  }
}
