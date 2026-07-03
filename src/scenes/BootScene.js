// 부팅: 데이터 JSON + 에셋 매니페스트 로드 → 실물 에셋 2차 로드(있으면) → gameState 초기화 →
// 애니메이션/타일셋 구성 → World 시작. 매니페스트가 없거나 비면 코드 플레이스홀더로 폴백한다.
import { gameState } from '../systems/gameState.js';
import { makePlaceholderCharacter, makePlaceholderTileset, makeMarker, TILE } from '../systems/placeholders.js';
import { buildCharacterAnims, specFromSidecar } from '../systems/animation.js';
import { panelImageKey } from '../systems/storyPanels.js';

// 플레이스홀더 캐릭터 색상(폴백 전용).
const CHAR_COLORS = {
  char_lyren: '#5b6c8f', char_miriam: '#6b5b6c', char_anika: '#8f7c5b',
  char_ornelia: '#5b8f7c', char_silas: '#8f5b5b', char_isolde: '#7c5b8f',
  char_kael: '#4d4d5b', char_corvinox: '#2e2e3a',
};

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    for (const k of ['config', 'progression', 'clues', 'connections', 'npcs', 'items', 'dialogues'])
      this.load.json(k, `data/${k}.json`);
    // 선택 로드(없으면 loaderror → 폴백). panels: 스토리 패널 대본, manifest: 에셋.
    this.load.on('loaderror', (f) => {
      if (f.key === 'manifest') this._noManifest = true;
      if (f.key === 'panels') this._noPanels = true;
    });
    this.load.json('manifest', 'assets/manifest.json');
    this.load.json('panels', 'data/panels.json');
  }

  create() {
    this.data_ = {
      config: this.cache.json.get('config'), progression: this.cache.json.get('progression'),
      clues: this.cache.json.get('clues'), connections: this.cache.json.get('connections'),
      npcs: this.cache.json.get('npcs'), items: this.cache.json.get('items'),
      dialogues: this.cache.json.get('dialogues'), // 트리거 디스패처(코어)가 소비
      // 스토리 패널 대본(R2 inject). 부재 시 storyPanels.js 내장 임시본 사용.
      panels: this._noPanels ? null : this.cache.json.get('panels'),
    };
    gameState.init(this.data_);
    this.registry.set('config', this.data_.config);

    const manifest = this._noManifest ? null : this.cache.json.get('manifest');
    const hasRealAssets = !!(manifest && manifest.sprites && manifest.sprites.length && !manifest.sprites[0].placeholder);

    if (hasRealAssets) {
      // 2차 로드: 실물 스프라이트시트 + 사이드카 + 타일셋 이미지.
      const fw = manifest.characterFrame.width, fh = manifest.characterFrame.height;
      for (const s of manifest.sprites) {
        this.load.spritesheet(s.spriteId, s.image, { frameWidth: fw, frameHeight: fh });
        this.load.json(s.spriteId + '__sc', s.sidecar);
      }
      for (const t of manifest.tilesets) this.load.image('tiles_' + t.id, t.image);
      for (const mk of (manifest.markers || [])) this.load.image(mk.id, mk.image); // 마커 아이콘 6종
      // 타이틀 배경(manifest.title: 문자열 경로 또는 {image}).
      const titleImg = typeof manifest.title === 'string' ? manifest.title : manifest.title && manifest.title.image;
      if (titleImg) this.load.image('title_bg', titleImg);
      // 스토리 패널 CG(manifest.panels). 텍스처 키 = 경로 basename(cg_id) → panels.json image 경로와 일치.
      for (const pn of (manifest.panels || [])) {
        const img = typeof pn === 'string' ? pn : pn.image;
        if (img) this.load.image(panelImageKey(img), img);
      }
      this.load.once('complete', () => this._finish(manifest));
      this.load.start();
    } else {
      console.warn('[Boot] 실물 에셋 없음 — 코드 플레이스홀더 사용');
      this._finish(null);
    }
  }

  _finish(manifest) {
    const cfg = this.data_.config;
    const frame = cfg.characterFrame || { width: 48, height: 64 };
    const tileSize = cfg.tileSize || 48;
    const animSpecs = {};

    // 상호작용 마커: 실물 아이콘(manifest.markers) 로드됐으면 그대로, 아니면 색상 원 폴백.
    const MARKER_DEFS = [
      ['marker_clue_document', '#c9a24b'], ['marker_clue_object', '#c9a24b'],
      ['marker_clue_testimony', '#d0b0e0'], ['marker_echo', '#8bd0ff'],
      ['marker_item', '#b0e07a'], ['marker_exit', '#a06b3b'],
    ];
    for (const [key, color] of MARKER_DEFS) {
      if (this.textures.exists(key)) continue; // 실물 아이콘 로드됨
      makeMarker(this, key, color);
    }

    // 캐릭터 애니메이션(실물 사이드카 spec 또는 플레이스홀더 기본 spec).
    for (const npc of this.data_.npcs.npcs) {
      const key = npc.spriteId;
      const sidecar = manifest ? this.cache.json.get(key + '__sc') : null;
      const spec = specFromSidecar(sidecar);
      animSpecs[key] = spec;
      if (!manifest) {
        makePlaceholderCharacter(this, key, {
          frameWidth: frame.width, frameHeight: frame.height,
          directions: spec.directions, framesPerDir: spec.framesPerDir,
          color: CHAR_COLORS[npc.id] || '#6b6b7a',
        });
      }
      buildCharacterAnims(this, key, spec);
    }

    // 타일셋 디스크립터(맵별). 실물: 사이드카 collidingTiles 로 바닥/벽/소품/장식 팔레트 구성.
    // 규약(전 맵 공통): 0~5 바닥 변주, 6/7 벽, 8~15 소품(맵별 충돌 상이) → 충돌 여부로 분류.
    const tilesets = {};
    if (manifest) {
      for (const t of manifest.tilesets) {
        const collision = t.collidingTiles || [];
        const cset = new Set(collision);
        tilesets[t.id] = {
          key: 'tiles_' + t.id,
          collision, collisionSet: cset,
          floorBase: 0,
          groundVariants: [1, 2, 3, 4, 5].filter(i => !cset.has(i)),
          wallMain: cset.has(6) ? 6 : (collision[0] ?? 1),
          wallAlt: cset.has(7) ? 7 : (cset.has(6) ? 6 : (collision[0] ?? 1)),
          collideProps: collision.filter(i => i >= 8),
          floorDecor: [8, 9, 10, 11, 12, 13, 14, 15].filter(i => !cset.has(i)),
        };
      }
      tilesets._default = tilesets[manifest.tilesets[0].id];
    } else {
      makePlaceholderTileset(this, 'tileset_main', tileSize);
      const ph = {
        key: 'tileset_main', collision: [TILE.WALL, TILE.DOOR], collisionSet: new Set([TILE.WALL, TILE.DOOR]),
        floorBase: TILE.FLOOR, groundVariants: [], wallMain: TILE.WALL, wallAlt: TILE.WALL,
        collideProps: [], floorDecor: [],
      };
      for (const m of Object.keys(cfg.maps || {})) tilesets[m] = ph;
      tilesets._default = ph;
    }

    this.registry.set('animSpecs', animSpecs);
    this.registry.set('tilesets', tilesets);
    this.registry.set('manifest', manifest);
    this.registry.set('usedPlaceholders', !manifest);
    this.scene.start('Title'); // Boot → Title → (시작) → World
  }
}
