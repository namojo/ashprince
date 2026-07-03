// HUD — 통찰 수치·힌트 토큰·현재 챕터·목표. 최소·비간섭(상단 얇은 양피지 띠).
import { PAL, CSS, FONT } from './theme.js';

const CHAPTER_TITLE = {
  1: '제1장 · 잿골 고아원',
  2: '제2장 · 미스트미어 마법원',
  3: '제3장 · 잿빛 첨탑',
  final: '종장 · 흩어진 진실',
  ending: '엔딩',
};

export class Hud {
  constructor(scene) {
    this.scene = scene;
    this.insight = 0;
    this.tokens = 0;
    this.chapter = 1;
    this._build();
  }

  _build() {
    const c = this.scene.add.container(0, 0).setDepth(300);
    this.container = c;

    // 상단 띠.
    const bar = this.scene.add.graphics();
    bar.fillStyle(PAL.deepGrey, 0.42);
    bar.fillRoundedRect(10, 8, 780, 34, 8);
    bar.lineStyle(1, PAL.fadedGold, 0.35);
    bar.strokeRoundedRect(10, 8, 780, 34, 8);

    this.chapterTxt = this.scene.add.text(24, 15, '', {
      fontFamily: FONT, fontSize: '17px', color: CSS.fadedGold, fontStyle: 'bold',
    });
    this.insightTxt = this.scene.add.text(560, 15, '', {
      fontFamily: FONT, fontSize: '16px', color: CSS.highlight,
    });
    this.tokenTxt = this.scene.add.text(690, 15, '', {
      fontFamily: FONT, fontSize: '16px', color: CSS.highlight,
    });

    // 목표(하단 중앙, 은은하게).
    this.objectiveTxt = this.scene.add.text(400, 566, '', {
      fontFamily: FONT, fontSize: '15px', color: CSS.parchment, fontStyle: 'italic',
      align: 'center', wordWrap: { width: 620 },
      backgroundColor: 'rgba(0,0,0,0.0)',
    }).setOrigin(0.5, 1);
    this.objectiveTxt.setShadow(1, 1, '#1a1a2e', 3);

    c.add([bar, this.chapterTxt, this.insightTxt, this.tokenTxt, this.objectiveTxt]);
    this._redraw();
  }

  _redraw() {
    this.chapterTxt.setText(CHAPTER_TITLE[this.chapter] || `제${this.chapter}장`);
    this.insightTxt.setText(`통찰 ${this.insight}`);
    this.tokenTxt.setText(`힌트 🕯 ${this.tokens}`);
  }

  setInsight(n) { this.insight = n; this._redraw(); }
  setTokens(n) { this.tokens = n; this._redraw(); }
  setChapter(ch) { this.chapter = ch; this._redraw(); }
  setObjective(text) { this.objectiveTxt.setText(text || ''); }
  hideObjective(v) { this.objectiveTxt.setVisible(!v); }
  setVisible(v) { this.container.setVisible(v); }
}
