'use strict';
/* ================================================================
 * 볼드모트: 어둠의 군주 v2 — 비공식 팬 게임
 * 모든 스토리/대사는 창작 텍스트입니다.
 * 렌더링 계약: window.ART (src/art.js, docs/ART_CONTRACT.md)
 * 섹션: 데이터 / 저장 / 오디오 / 엔진 / 입력 / 엔티티 / 스킬 / 웨이브 / 보스 / UI
 * ================================================================ */

/* ==================== [데이터] ==================== */

const STAGES = [
  {
    title: '1장 · 낡은 일기장',
    place: '버려진 리들 저택',
    story: '기억은 낡은 저택의 먼지 속에 잠들어 있었다. 소년 시절의 나, 톰 리들이 처음으로 영혼을 쪼개어 담았던 일기장. 그 첫 조각이 위험에 처했다는 소식이 어둠을 타고 전해졌다.\n\n오러들이 저택을 포위했다. 놈들은 내 과거를 파헤치고, 내 불멸의 뿌리를 뽑으려 한다. 가소로운 일이다.\n\n오늘 밤, 이 저택의 어둠이 얼마나 깊은지 저들에게 가르쳐 주겠다.',
    bossKey: 'moody',
    horcrux: '일기장',
  },
  {
    title: '2장 · 곤트의 반지',
    place: '곤트 가문의 오두막',
    story: '어머니의 핏줄, 몰락한 곤트 가문의 오두막. 썩은 마룻바닥 아래에 두 번째 조각이 숨 쉬고 있다. 반지에 걸어 둔 저주는 여전히 살아 있지만, 저들의 집요함은 저주보다 끈질기다.\n\n불사조 기사단이 오두막 주변의 늪을 건너오고 있다. 밤안개 속에서 지팡이 불빛이 하나둘 떠오른다. 빗자루를 탄 기동대가 나무 사이를 스치며 급습해 온다.\n\n좋다. 늪은 시체를 감추기 좋은 곳이지.',
    bossKey: 'tonks',
    horcrux: '곤트의 반지',
  },
  {
    title: '3장 · 슬리데린의 로켓',
    place: '바닷가의 검은 동굴',
    story: '파도가 절벽을 물어뜯는 검은 동굴. 물 아래의 손들이 지키는 호수 한가운데, 세 번째 조각이 잠들어 있다.\n\n그러나 동굴 입구에 낯익은 마력의 흔적이 남아 있었다. 아즈카반을 벗어난 사냥개가 제 발로 죽을 곳을 찾아온 모양이다.\n\n동굴의 어둠은 나의 것이다. 이곳에서 빛은 오래 버티지 못한다.',
    bossKey: 'sirius',
    horcrux: '슬리데린의 로켓',
  },
  {
    title: '4장 · 후플푸프의 잔',
    place: '그린고츠 깊은 금고',
    story: '땅속 깊은 곳, 용의 숨결이 데운 금고 안에 네 번째 조각이 있다. 금화 더미 사이에서 잔은 조용히 내 영혼을 담아 왔다.\n\n호그와트의 교수들이 금고로 통하는 갱도를 막아섰다. 변신술의 대가가 직접 내려왔다는군. 지팡이를 잡은 손끝이 오랜만에 떨린다. 두려움이 아니라, 기대감으로.\n\n깊은 땅속에서는 비명도 멀리 가지 못한다.',
    bossKey: 'mcgonagall',
    horcrux: '후플푸프의 잔',
  },
  {
    title: '5장 · 래번클로의 보관',
    place: '호그와트 · 필요의 방',
    story: '천 개의 잃어버린 물건들이 쌓인 방. 그 미로 한가운데에 다섯 번째 조각, 지혜의 보관이 놓여 있다.\n\n그런데 방문 앞에 서 있는 것은 다름 아닌 나의 심복이었다. 세베루스 스네이프. 그의 눈빛이 전과 다르다. 오클루먼시로도 가릴 수 없는 것이 새어 나오고 있다.\n\n배신의 냄새는 어떤 어둠 속에서도 맡을 수 있지. 시험해 보겠다. 그의 충성심과, 그의 목숨을.',
    bossKey: 'snape',
    horcrux: '래번클로의 보관',
  },
  {
    title: '6장 · 나기니',
    place: '호그와트 경계 · 금지된 숲',
    story: '나기니, 나의 마지막 벗이자 여섯 번째 조각. 숲의 어둠 속에서 그녀의 비늘이 차갑게 빛난다.\n\n소년이 온다. 이마에 흉터를 지닌 그 아이가, 홀로 숲을 걸어 들어온다. 예언이 우리를 이 밤으로 끌고 왔다.\n\n소년이여, 네가 지키려는 모든 것이 오늘 밤 재가 될 것이다. 둘 중 하나는 이 숲을 걸어 나가지 못한다.',
    bossKey: 'harry',
    horcrux: '나기니',
  },
  {
    title: '최종장 · 마지막 문',
    place: '호그와트 대전당',
    story: '모든 조각을 지켜냈다. 이제 나와 죽음 사이에는 단 한 사람만이 서 있다.\n\n무너진 대전당, 부서진 촛불들 위로 그가 내려온다. 알버스 덤블도어. 내가 소년이던 시절부터 나를 꿰뚫어 보던 유일한 눈.\n\n"죽음보다 무서운 것이 있다"고 그는 늘 말했지. 오늘 밤 증명해 주겠다. 이 세상에 죽음보다 강한 것은 없으며, 죽음을 정복한 자가 곧 왕이라는 것을.',
    bossKey: 'dumbledore',
    horcrux: '영원한 어둠',
  },
];

const BOSSES = {
  moody:      { name: '앨러스터 무디',     line: '어둠의 군주가 직접 납시었군. 이 늙은 오러의 눈은 아직 어둡지 않다!', hp: 520,  patterns: ['aim'],                      sig: 'laser',     sigCd: 7.5 },
  tonks:      { name: '님파도라 통스',     line: '네가 앗아간 이들의 이름을, 나는 하나도 잊지 않았다!',               hp: 780,  patterns: ['aim', 'spread'],            sig: 'clones',    sigCd: 10 },
  sirius:     { name: '시리우스 블랙',     line: '아즈카반도 나를 가두지 못했다. 너 따위가 막을 수 있을 것 같나!',    hp: 1080, patterns: ['aim', 'spread'],            sig: 'dogcharge', sigCd: 8.5 },
  mcgonagall: { name: '미네르바 맥고나걸', line: '호그와트의 문은 너에게 결코 열리지 않는다.',                        hp: 1450, patterns: ['spread', 'aim'],            sig: 'chess',     sigCd: 9 },
  snape:      { name: '세베루스 스네이프', line: '어둠의 왕이시여… 당신이 끝내 알지 못한 것이 하나 있습니다.',        hp: 1850, patterns: ['aim', 'spread', 'dash'],    sig: 'xslash',    sigCd: 7.5 },
  harry:      { name: '해리 포터',         line: '더는 아무도 잃지 않아. 오늘 밤, 여기서 끝내겠어!',                  hp: 2350, patterns: ['aim', 'spread', 'summon'],  sig: 'disarm',    sigCd: 9 },
  dumbledore: { name: '알버스 덤블도어',   line: '톰… 아직도 죽음이 가장 두려운 것이라 믿고 있구나.',                 hp: 3300, patterns: ['aim', 'spread', 'dash', 'summon'], sig: 'firestorm', sigCd: 8.5 },
};

const ETYPES = {
  auror:    { name: '오러',              hp: 22,  spd: 105, dmg: 10, r: 15, souls: 2 },
  order:    { name: '기사단원',          hp: 40,  spd: 52,  dmg: 12, r: 17, souls: 3 },
  guardian: { name: '패트로누스 수호자', hp: 105, spd: 34,  dmg: 18, r: 23, souls: 5 },
  broom:    { name: '빗자루 기동대',     hp: 26,  spd: 225, dmg: 13, r: 15, souls: 3 },
  shielder: { name: '결계술사',          hp: 72,  spd: 46,  dmg: 10, r: 18, souls: 6 },
  splitter: { name: '분열술사',          hp: 56,  spd: 78,  dmg: 12, r: 18, souls: 4 },
  sniper:   { name: '저격 마법사',       hp: 48,  spd: 130, dmg: 24, r: 16, souls: 5 },
  chess:    { name: '체스 병정',         hp: 95,  spd: 62,  dmg: 20, r: 17, souls: 3 },
};

const UPGRADES = [
  { id: 'damage', name: '공격력',     desc: '마법 볼트의 피해 +25%',        base: 25, mult: 1.55, max: 10 },
  { id: 'hp',     name: '최대 생명력', desc: '최대 생명력 +25',              base: 20, mult: 1.5,  max: 10 },
  { id: 'speed',  name: '이동 속도',   desc: '이동 속도 +12%',               base: 18, mult: 1.5,  max: 8 },
  { id: 'cdr',    name: '스킬 단련',   desc: '스킬 쿨타임 -6%',              base: 28, mult: 1.55, max: 8 },
  { id: 'multi',  name: '볼트 개수',   desc: '동시에 발사하는 볼트 +1 (최대 5)', base: 80, mult: 2.3,  max: 4 },
];

const SKILLS = [
  { key: 'avada',     name: '아바다 케다브라', cd: 9,  dur: 0.55, unlock: 0 },
  { key: 'fiendfyre', name: '악령의 불',       cd: 15, dur: 0.7,  unlock: 0 },
  { key: 'shield',    name: '호크룩스 결계',   cd: 20, dur: 5.0,  unlock: 0 },
  { key: 'nagini',    name: '나기니의 습격',   cd: 18, dur: 8.0,  unlock: 1 },
  { key: 'crucio',    name: '크루시아투스',    cd: 26, dur: 2.5,  unlock: 3 },
  { key: 'darkmark',  name: '어둠의 표식',     cd: 45, dur: 1.1,  unlock: 5 },
];

const OVER_LINES = [
  '육신이 무너졌다. 그러나 호크룩스가 남아 있는 한, 죽음은 나를 붙잡지 못한다.\n어둠 속에서 다시 형체를 얻어, 같은 곳으로 돌아간다.',
  '고통은 잠시, 어둠은 영원하다.\n흩어진 영혼이 다시 모여든다…',
  '이 정도로 끝날 몸이었다면 애초에 영혼을 쪼개지도 않았다.\n다시 일어선다.',
];

const VICTORY_TEXT = '마지막 불빛이 꺼지고, 대전당의 어둠이 온 세상으로 흘러넘쳤다.\n\n일곱 조각의 영혼은 완전해졌고, 죽음은 더 이상 나를 부르지 못한다. 이제 이 세계의 낮과 밤은 모두 나의 것이다.\n\n그러나 옥좌에 앉은 밤, 문득 낡은 일기장의 첫 페이지가 떠올랐다. 고아원의 좁은 침대, 아무도 부르지 않던 이름. 영원을 손에 넣은 왕은, 영원히 그 이름과 함께 남게 되었다.\n\n— 끝 · 플레이해 주셔서 감사합니다 —';

/* ==================== [저장] ==================== */

const SAVE_KEY = 'voldemort_dark_lord_v1';
const Save = {
  data: null,
  fresh() {
    return { stage: 0, souls: 0, up: { damage: 0, hp: 0, speed: 0, cdr: 0, multi: 0 }, muted: false, cleared: false, started: false };
  },
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        this.data = Object.assign(this.fresh(), d);
        this.data.up = Object.assign(this.fresh().up, d.up || {});
        // 손상된 저장 데이터 방어: 숫자 필드는 정수로 강제, 범위 제한
        const int = (v, max) => { v = Math.floor(Number(v)); return Number.isFinite(v) ? Math.min(max, Math.max(0, v)) : 0; };
        this.data.stage = int(this.data.stage, 6);
        this.data.souls = int(this.data.souls, 999999);
        for (const k of Object.keys(this.fresh().up)) this.data.up[k] = int(this.data.up[k], 10);
        this.data.muted = !!this.data.muted;
        this.data.cleared = !!this.data.cleared;
        this.data.started = !!this.data.started;
        return;
      }
    } catch (e) { /* 저장 불가 환경 */ }
    this.data = this.fresh();
  },
  write() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* 무시 */ }
  },
  reset() { this.data = this.fresh(); this.write(); },
};
Save.load();

function skillUnlocked(i) { return Save.data.cleared || Save.data.stage >= SKILLS[i].unlock; }

/* ==================== [오디오] ==================== */

const Snd = {
  ctx: null, master: null, bgmGain: null, silentEl: null,
  muted: Save.data.muted, bgmTimer: null, nextBar: 0, barIdx: 0,
  unlock() {
    // iOS 측면 무음 스위치가 켜져 있으면 Web Audio가 통째로 음소거된다.
    // Audio Session API(iOS 17+)로 재생 세션을 선언하고,
    // 구형 iOS 는 무음 <audio> 루프 재생으로 세션을 'playback'으로 전환해 우회한다.
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* 미지원 */ }
    if (!this.silentEl) {
      // 0.05초 무음 WAV (44.1kHz 8bit mono)
      const el = document.createElement('audio');
      el.src = 'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
      el.loop = true;
      el.setAttribute('playsinline', '');
      this.silentEl = el;
    }
    if (this.silentEl.paused) this.silentEl.play().catch(() => { /* 제스처 밖 호출 등 — 다음 터치에 재시도 */ });
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.55;
      this.master.connect(this.ctx.destination);
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.30;
      this.bgmGain.connect(this.master);
      this.startBgm();
    }
    // iOS는 전화/시리 이후 'interrupted' 상태가 되므로 'suspended'만 검사하면 복구 불가
    if (this.ctx.state !== 'running') this.ctx.resume();
  },
  setMuted(m) {
    this.muted = m;
    Save.data.muted = m; Save.write();
    if (this.master) this.master.gain.value = m ? 0 : 0.55;
  },
  tone(freq, dur, type, vol, endFreq, delay) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  },
  noise(dur, vol, freq, delay) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + (delay || 0);
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 900;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0);
  },
  play(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'shoot':   this.tone(720, 0.09, 'square', 0.05, 240); break;
      case 'hit':     this.tone(210, 0.08, 'sawtooth', 0.07, 90); break;
      case 'die':     this.noise(0.22, 0.12, 700); this.tone(320, 0.2, 'triangle', 0.08, 60); break;
      case 'hurt':    this.tone(140, 0.22, 'sawtooth', 0.16, 55); this.noise(0.16, 0.1, 500); break;
      case 'soul':    this.tone(880, 0.07, 'sine', 0.05, 1320); break;
      case 'beam':    this.tone(90, 0.6, 'sawtooth', 0.18, 480); this.noise(0.5, 0.12, 1400); break;
      case 'fire':    this.noise(0.75, 0.22, 1100); this.tone(70, 0.7, 'sawtooth', 0.14, 30); break;
      case 'shieldOn':this.tone(300, 0.35, 'sine', 0.12, 620); this.tone(450, 0.4, 'sine', 0.08, 900, 0.08); break;
      case 'snake':   this.noise(0.55, 0.14, 2600); this.tone(180, 0.3, 'triangle', 0.06, 90); break;
      case 'crucio':  this.tone(520, 0.7, 'sawtooth', 0.14, 110); this.tone(760, 0.55, 'square', 0.07, 140, 0.05); this.noise(0.4, 0.1, 800); break;
      case 'darkmark':this.tone(48, 1.6, 'sawtooth', 0.24, 30); this.noise(1.1, 0.16, 240); this.tone(392, 0.9, 'triangle', 0.1, 196, 0.25); break;
      case 'laser':   this.tone(1400, 0.8, 'sawtooth', 0.1, 300); this.noise(0.6, 0.08, 2400); break;
      case 'snipe':   this.tone(1600, 0.12, 'square', 0.09, 400); break;
      case 'disarm':  this.tone(980, 0.4, 'square', 0.1, 180); break;
      case 'slash':   this.noise(0.2, 0.16, 3200); this.tone(700, 0.16, 'sawtooth', 0.1, 200); break;
      case 'phoenix': this.tone(900, 0.9, 'sawtooth', 0.12, 120); this.noise(0.8, 0.14, 1500); break;
      case 'boss':    this.tone(60, 1.1, 'sawtooth', 0.2, 38); this.noise(0.9, 0.14, 300); break;
      case 'clear':   [523, 622, 784, 1046].forEach((f, i) => this.tone(f, 0.32, 'triangle', 0.09, null, i * 0.11)); break;
      case 'ui':      this.tone(500, 0.06, 'sine', 0.07, 700); break;
      case 'buy':     this.tone(660, 0.1, 'sine', 0.08, 990); this.tone(990, 0.14, 'sine', 0.06, 1320, 0.07); break;
      case 'deny':    this.tone(180, 0.14, 'square', 0.06, 120); break;
      case 'over':    this.tone(220, 0.8, 'sawtooth', 0.12, 40); this.tone(110, 1.2, 'triangle', 0.1, 30, 0.15); break;
    }
  },
  /* 배경음: 낮은 드론 + 단조 아르페지오 스케줄러 */
  startBgm() {
    if (this.bgmTimer) return;
    this.nextBar = this.ctx.currentTime + 0.1;
    this.barIdx = 0;
    this.bgmTimer = setInterval(() => this.schedBgm(), 300);
  },
  schedBgm() {
    if (!this.ctx || this.muted) { this.nextBar = Math.max(this.nextBar, this.ctx ? this.ctx.currentTime + 0.1 : 0); return; }
    const BAR = 2.4;
    while (this.nextBar < this.ctx.currentTime + 1.2) {
      const t = this.nextBar;
      const roots = [73.42, 73.42, 87.31, 69.30]; // D2 D2 F2 C#2
      const root = roots[this.barIdx % 4];
      const o1 = this.ctx.createOscillator(), o2 = this.ctx.createOscillator();
      const g = this.ctx.createGain(); const f = this.ctx.createBiquadFilter();
      o1.type = 'sawtooth'; o2.type = 'sawtooth';
      o1.frequency.value = root; o2.frequency.value = root * 1.006;
      f.type = 'lowpass'; f.frequency.value = 260;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.4);
      g.gain.linearRampToValueAtTime(0.0001, t + BAR);
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.bgmGain);
      o1.start(t); o2.start(t); o1.stop(t + BAR + 0.05); o2.stop(t + BAR + 0.05);
      const scale = [293.66, 349.23, 440.0, 466.16, 554.37];
      const n = 2 + (this.barIdx % 2);
      for (let i = 0; i < n; i++) {
        const nf = scale[Math.floor(Math.random() * scale.length)] * (Math.random() < 0.25 ? 0.5 : 1);
        const ob = this.ctx.createOscillator(); const gb = this.ctx.createGain();
        ob.type = 'sine'; ob.frequency.value = nf;
        const tn = t + (i * BAR) / n + Math.random() * 0.15;
        gb.gain.setValueAtTime(0.0001, tn);
        gb.gain.linearRampToValueAtTime(0.045, tn + 0.02);
        gb.gain.exponentialRampToValueAtTime(0.001, tn + 1.4);
        ob.connect(gb); gb.connect(this.bgmGain);
        ob.start(tn); ob.stop(tn + 1.5);
      }
      this.nextBar += BAR; this.barIdx++;
    }
  },
};

/* ==================== [엔진: 캔버스 / 루프] ==================== */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, DPR = 1;

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ART.resize(W, H);
  if (player) {
    player.x = clamp(player.x, 24, W - 24);
    player.y = clamp(player.y, H * 0.35, H - 60);
  }
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 250));

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function rand(a, b) { return a + Math.random() * (b - a); }
function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }

/* ==================== [게임 상태] ==================== */

const SCROLL_SPD = 90; // 종스크롤 체감 속도 (px/s)

const G = {
  state: 'loading',   // loading | title | story | play | shop | over | victory | pause
  stage: 0,
  wave: 0,            // 1..5, 6 = 보스
  time: 0,
  scrollY: 0,         // 누적 종스크롤
  shake: 0,
  boss: null,
  clones: [],         // 통스 거울 분신
  phoenix: null,      // 덤블도어 2페이즈 불사조
  pending: null,      // { t, fn }
  runSouls: 0,
  flash: 0,
  crucioT: 0,         // 크루시아투스 화면 연출
  darkmark: null,     // { t, fired }
};

const enemies = [], bullets = [], ebullets = [], particles = [], texts = [], pickups = [], deadFx = [];
const MAXP = 160, MAXT = 26;

/* 사망 잔상: 스프라이트가 하얗게 번지며 스러진다 */
function pushGhost(key, x, y, size) {
  if (deadFx.length >= 10) deadFx.shift();
  deadFx.push({ key, x, y, size, t: 0, life: 0.38, rot: rand(-0.5, 0.5) });
}

function updateDeadFx(dt) {
  for (let i = deadFx.length - 1; i >= 0; i--) {
    deadFx[i].t += dt;
    if (deadFx[i].t >= deadFx[i].life) deadFx.splice(i, 1);
  }
}

const player = {
  x: 0, y: 0, r: 20,
  hp: 100, maxhp: 100,
  fireT: 0, dead: false,
  shieldT: 0, beamT: 0, ringT: 0, ringHit: null,
  snakeT: 0, disarmT: 0,
  hitFlash: 0, wandT: 0, vxSm: 0,
};

function stats() {
  const u = Save.data.up;
  return {
    dmg: 12 * (1 + 0.25 * u.damage),
    maxhp: 100 + 25 * u.hp,
    speed: 320 * (1 + 0.12 * u.speed),
    cdr: Math.max(0.4, 1 - 0.06 * u.cdr),
    shots: Math.min(5, 1 + u.multi),
    fireInt: 0.38,
  };
}

const skillState = SKILLS.map(() => ({ t: 0 }));

function schedule(t, fn) {
  // 사망 연출(게임 오버)이 이미 예약돼 있으면 다른 예약이 덮어쓰지 못하게 한다
  if (G.pending && G.pending.fn === showGameOver) return;
  G.pending = { t, fn };
}

/* ==================== [입력] ==================== */

const Input = {
  drag: null, // { sx, sy, px, py, id }
  tx: 0, ty: 0, active: false,
  init() {
    const el = canvas;
    const down = (x, y, id) => {
      Snd.unlock();
      if (G.state !== 'play' || player.dead) return;
      if (this.drag) return; // 첫 손가락이 드래그 소유권 유지 (두 번째 터치가 이동을 빼앗지 않도록)
      this.drag = { sx: x, sy: y, px: player.x, py: player.y, id };
      this.tx = player.x; this.ty = player.y; this.active = true;
    };
    const move = (x, y, id) => {
      if (!this.drag || this.drag.id !== id) return;
      this.tx = clamp(this.drag.px + (x - this.drag.sx) * 1.2, 22, W - 22);
      this.ty = clamp(this.drag.py + (y - this.drag.sy) * 1.2, H * 0.32, H - 46);
    };
    const up = (id) => { if (this.drag && this.drag.id === id) { this.drag = null; this.active = false; } };

    if (window.PointerEvent) {
      el.addEventListener('pointerdown', e => { e.preventDefault(); down(e.clientX, e.clientY, e.pointerId); }, { passive: false });
      window.addEventListener('pointermove', e => move(e.clientX, e.clientY, e.pointerId), { passive: true });
      window.addEventListener('pointerup', e => up(e.pointerId));
      window.addEventListener('pointercancel', e => up(e.pointerId));
    } else {
      el.addEventListener('touchstart', e => { e.preventDefault(); const t = e.changedTouches[0]; down(t.clientX, t.clientY, t.identifier); }, { passive: false });
      el.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) move(t.clientX, t.clientY, t.identifier); }, { passive: false });
      el.addEventListener('touchend', e => { for (const t of e.changedTouches) up(t.identifier); });
      el.addEventListener('mousedown', e => down(e.clientX, e.clientY, 'm'));
      window.addEventListener('mousemove', e => move(e.clientX, e.clientY, 'm'));
      window.addEventListener('mouseup', () => up('m'));
    }
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault());
    document.addEventListener('touchmove', e => { if (e.scale && e.scale !== 1) e.preventDefault(); }, { passive: false });
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.body.addEventListener('touchstart', () => Snd.unlock(), { passive: true });
  },
};

/* ==================== [엔티티: 생성] ==================== */

function scaleMul() { return 1 + 0.42 * G.stage + 0.07 * Math.min(G.wave, 5); }
function dmgMul() { return 1 + 0.14 * G.stage; }

function baseEnemy(type) {
  const d = ETYPES[type];
  const m = scaleMul();
  return {
    type, name: d.name,
    x: rand(30, W - 30), y: rand(-90, -40),
    hp: d.hp * m, maxhp: d.hp * m,
    spd: d.spd * (1 + 0.03 * G.stage) * rand(0.9, 1.1),
    dmg: d.dmg * dmgMul(),
    r: d.r, souls: d.souls,
    t: rand(0, 6.28), fireT: rand(1.2, 2.4),
    hitT: 0, stunT: 0, dotT: 0, dotDps: 0, shielded: false,
  };
}

function spawnEnemy(type, opt) {
  const e = baseEnemy(type);
  if (type === 'order') {
    e.stopY = rand(H * 0.18, H * 0.4);
  } else if (type === 'broom') {
    const fromLeft = Math.random() < 0.5;
    e.x = fromLeft ? -34 : W + 34;
    e.baseY = rand(H * 0.12, H * 0.42);
    e.y = e.baseY;
    e.vx = (fromLeft ? 1 : -1) * e.spd;
    e.amp = rand(38, 78);
    e.crossings = 0;
  } else if (type === 'shielder') {
    e.stopY = rand(H * 0.18, H * 0.32);
    e.shieldR = 125;
  } else if (type === 'sniper') {
    e.stopY = rand(H * 0.07, H * 0.16);
    e.aim = null; e.aimCd = rand(0.6, 1.4);
  } else if (type === 'splitter') {
    e.gen = 1;
  } else if (type === 'chess') {
    e.x = opt && opt.x != null ? opt.x : e.x;
    e.y = -34;
  }
  enemies.push(e);
  return e;
}

function spawnSplitChild(parent) {
  for (const dx of [-14, 14]) {
    const e = baseEnemy('splitter');
    e.gen = 2;
    e.x = clamp(parent.x + dx, 20, W - 20);
    e.y = parent.y;
    e.hp = e.maxhp = parent.maxhp * 0.35;
    e.r = 12; e.souls = 1;
    e.spd = parent.spd * 1.35;
    enemies.push(e);
  }
  addParticles(parent.x, parent.y, 12, '#c07bff', 150, 0.5, 4);
}

function spawnBoss() {
  const bk = STAGES[G.stage].bossKey;
  const bd = BOSSES[bk];
  const hp = bd.hp * (1 + 0.1 * Save.data.up.damage);
  G.boss = {
    key: bk, name: bd.name,
    x: W / 2, y: -110, ty: H * 0.2,
    hp, maxhp: hp, r: 40,
    t: 0, swayT: rand(0, 6.28), fireT: 1.6, patterns: bd.patterns,
    dashT: 0, dashVX: 0, dashVY: 0, dashing: 0, returning: false,
    summonT: 7, phase: 1, dmg: 22 * dmgMul(), touchT: 0,
    entering: true,
    sig: null, sigT: 4.5, sigCd: bd.sigCd, sigName: bd.sig,
    telegraph: 0, stunT: 0, dotT: 0, dotDps: 0, hitT: 0, dogMode: false,
  };
  document.getElementById('bossName').textContent = bd.name;
  document.getElementById('bossBar').classList.remove('hidden');
  Snd.play('boss');
  shake(10);
}

function fireBolt() {
  const st = stats();
  let tgt = null, best = 1e18;
  for (const e of enemies) {
    if (e.y < -20) continue;
    const d = dist2(player.x, player.y, e.x, e.y);
    if (d < best) { best = d; tgt = e; }
  }
  for (const c of G.clones) {
    const d = dist2(player.x, player.y, c.x, c.y);
    if (d < best) { best = d; tgt = c; }
  }
  if (G.boss && !G.boss.entering) {
    const d = dist2(player.x, player.y, G.boss.x, G.boss.y);
    if (d < best) { best = d; tgt = G.boss; }
  }
  if (!tgt) return;
  const ang = Math.atan2(tgt.y - player.y, tgt.x - player.x);
  const n = st.shots;
  const spread = n > 1 ? 0.14 : 0;
  for (let i = 0; i < n; i++) {
    const a = ang + (i - (n - 1) / 2) * spread;
    bullets.push({ x: player.x, y: player.y - 14, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, dmg: st.dmg, r: 5, life: 1.6 });
  }
  player.wandT = 0.12;
  Snd.play('shoot');
}

function addParticles(x, y, n, color, spd, life, size) {
  for (let i = 0; i < n; i++) {
    if (particles.length >= MAXP) break;
    const a = rand(0, 6.283), s = rand(spd * 0.3, spd);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: rand(life * 0.6, life), color, size: rand(size * 0.5, size) });
  }
}

function addText(x, y, txt, color, big) {
  if (texts.length >= MAXT) texts.shift();
  texts.push({ x: x + rand(-8, 8), y, txt, color, t: 0, big: !!big });
}

function dropSouls(x, y, n) {
  for (let i = 0; i < n; i++) {
    pickups.push({ x: x + rand(-14, 14), y: y + rand(-14, 14), vx: rand(-40, 40), vy: rand(-70, -20), t: 0 });
  }
}

function shake(v) { G.shake = Math.min(18, G.shake + v); }

/* ==================== [전투 처리] ==================== */

function damageEnemy(e, dmg, isBoss) {
  if (!isBoss && e.shielded) {
    dmg *= 0.15;
    if (Math.random() < 0.1) addText(e.x, e.y - e.r - 6, '결계', '#8fd9ff');
  }
  e.hp -= dmg;
  e.hitT = 0.08;
  const tick = dmg < 5; // 광선 등 지속 피해는 표시/사운드를 간헐적으로
  if (!tick || Math.random() < 0.15) addText(e.x, e.y - e.r - 6, Math.round(Math.max(1, dmg)), '#baffb0');
  if (e.hp <= 0) {
    if (isBoss) return killBoss();
    Snd.play('die');
    if (e.type !== 'chess') pushGhost(e.type, e.x, e.y, e.r * 3.6);
    const col = e.type === 'guardian' ? '#9fd8e8' : (e.type === 'chess' ? '#8f88b8' : '#8a5a9a');
    addParticles(e.x, e.y, 14, col, 160, 0.7, 4);
    addParticles(e.x, e.y, 8, '#7CFF6B', 120, 0.5, 3);
    dropSouls(e.x, e.y, e.souls);
    const idx = enemies.indexOf(e);
    if (idx >= 0) enemies.splice(idx, 1);
    if (e.type === 'splitter' && e.gen === 1) spawnSplitChild(e);
  } else if (!tick || Math.random() < 0.12) {
    Snd.play('hit');
  }
}

function damageClone(c, dmg) {
  c.hp -= dmg;
  c.hitT = 0.08;
  if (c.hp <= 0) {
    const idx = G.clones.indexOf(c);
    if (idx >= 0) G.clones.splice(idx, 1);
    pushGhost(c.key, c.x, c.y, c.r * 3.3);
    addParticles(c.x, c.y, 18, '#e07bff', 180, 0.7, 4);
    Snd.play('die');
  }
}

function killBoss() {
  const b = G.boss; if (!b || player.dead) return;
  pushGhost(b.key, b.x, b.y, b.r * 3.3);
  G.boss = null;
  G.clones.length = 0;
  G.phoenix = null;
  document.getElementById('bossBar').classList.add('hidden');
  Snd.play('clear');
  shake(16);
  G.flash = 0.5;
  addParticles(b.x, b.y, 60, '#e8b3ff', 260, 1.2, 6);
  addParticles(b.x, b.y, 40, '#e07bff', 220, 1.0, 5);
  dropSouls(b.x, b.y, 30 + G.stage * 6);
  ebullets.length = 0;
  banner(STAGES[G.stage].horcrux + ' 확보', '영혼의 조각이 어둠 속에서 안전해졌다.');
  schedule(2.4, stageClear);
}

function hurtPlayer(dmg) {
  if (player.dead) return;
  // 보스 처치 확정(스테이지 클리어 예약) 이후에는 잔존 적에게 죽지 않는다
  if (G.pending && G.pending.fn === stageClear) return;
  if (player.shieldT > 0) {
    addText(player.x, player.y - 30, '결계', '#8effc0');
    return;
  }
  player.hp -= dmg;
  player.hitFlash = 0.25;
  shake(6);
  Snd.play('hurt');
  addParticles(player.x, player.y, 10, '#ff5d6b', 150, 0.5, 4);
  if (player.hp <= 0) {
    player.hp = 0;
    player.dead = true;
    Input.drag = null;
    Snd.play('over');
    shake(14);
    addParticles(player.x, player.y, 50, '#2b1a4a', 220, 1.2, 6);
    addParticles(player.x, player.y, 30, '#7CFF6B', 260, 1.0, 4);
    schedule(1.4, showGameOver);
  }
}

/* ==================== [스킬] ==================== */

function useSkill(i) {
  if (G.state !== 'play' || player.dead) return;
  if (!skillUnlocked(i)) {
    Snd.play('deny');
    banner('', '『' + SKILLS[i].name + '』 — ' + SKILLS[i].unlock + '장 클리어 시 해금');
    return;
  }
  if (skillState[i].t > 0) { Snd.play('deny'); return; }
  const st = stats();
  skillState[i].t = SKILLS[i].cd * st.cdr;
  const key = SKILLS[i].key;
  if (key === 'avada') {
    player.beamT = SKILLS[i].dur;
    Snd.play('beam');
    shake(5);
  } else if (key === 'fiendfyre') {
    player.ringT = SKILLS[i].dur;
    player.ringHit = new Set();
    Snd.play('fire');
    shake(8);
  } else if (key === 'shield') {
    player.shieldT = SKILLS[i].dur;
    player.hp = Math.min(player.maxhp, player.hp + player.maxhp * 0.25);
    Snd.play('shieldOn');
    addParticles(player.x, player.y, 20, '#7CFF6B', 130, 0.8, 4);
    addText(player.x, player.y - 34, '+' + Math.round(player.maxhp * 0.25), '#8effc0', true);
  } else if (key === 'nagini') {
    player.snakeT = SKILLS[i].dur;
    Snd.play('snake');
    addText(player.x, player.y - 34, '나기니!', '#8fe8b0', true);
  } else if (key === 'crucio') {
    G.crucioT = 0.8;
    Snd.play('crucio');
    shake(10);
    for (const e of enemies) {
      e.stunT = Math.max(e.stunT, SKILLS[i].dur);
      e.dotT = 4; e.dotDps = st.dmg * 1.4;
    }
    if (G.boss && !G.boss.entering) {
      G.boss.stunT = Math.max(G.boss.stunT, 1.1); // 보스는 저항
      G.boss.dotT = 4; G.boss.dotDps = st.dmg * 1.2;
      addText(G.boss.x, G.boss.y - G.boss.r - 12, '고통!', '#ff8fa0', true);
    }
  } else if (key === 'darkmark') {
    G.darkmark = { t: SKILLS[i].dur, fired: false };
    Snd.play('darkmark');
    shake(6);
  }
}

function updateSkills(dt) {
  if (player.dead) return; // 사망 후 광선/고리가 보스를 잡아 사망 처리를 건너뛰는 것 방지
  const st = stats();
  for (const s of skillState) s.t = Math.max(0, s.t - dt);
  // 아바다 케다브라 광선
  if (player.beamT > 0) {
    player.beamT -= dt;
    const dps = st.dmg * 14;
    const hitW = 46;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.y < player.y && Math.abs(e.x - player.x) < hitW + e.r) damageEnemy(e, dps * dt);
    }
    for (let i = G.clones.length - 1; i >= 0; i--) {
      const c = G.clones[i];
      if (c.y < player.y && Math.abs(c.x - player.x) < hitW + c.r) damageClone(c, dps * dt);
    }
    if (G.boss && !G.boss.entering && G.boss.y < player.y && Math.abs(G.boss.x - player.x) < hitW + G.boss.r) {
      damageEnemy(G.boss, dps * dt, true);
    }
    if (Math.random() < 0.6) addParticles(player.x + rand(-20, 20), rand(0, player.y), 1, '#7CFF6B', 60, 0.4, 3);
  }
  // 악령의 불 고리
  if (player.ringT > 0) {
    player.ringT -= dt;
    const dur = SKILLS[1].dur;
    const prog = 1 - player.ringT / dur;
    const rr = 40 + prog * Math.min(W, 420) * 0.75;
    const hit = (e, kind) => {
      const key = kind === 'boss' ? 'boss' : e;
      if (player.ringHit.has(key)) return;
      const d = Math.sqrt(dist2(player.x, player.y, e.x, e.y));
      if (Math.abs(d - rr) < 46 + e.r) {
        player.ringHit.add(key);
        if (kind === 'boss') damageEnemy(e, st.dmg * 5, true);
        else if (kind === 'clone') damageClone(e, st.dmg * 7);
        else damageEnemy(e, st.dmg * 7);
      }
    };
    for (let i = enemies.length - 1; i >= 0; i--) hit(enemies[i], 'enemy');
    for (let i = G.clones.length - 1; i >= 0; i--) hit(G.clones[i], 'clone');
    if (G.boss && !G.boss.entering) hit(G.boss, 'boss');
    if (particles.length < MAXP - 6) {
      for (let k = 0; k < 5; k++) {
        const a = rand(0, 6.283);
        particles.push({ x: player.x + Math.cos(a) * rr, y: player.y + Math.sin(a) * rr, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60 - 40, t: 0, life: rand(0.3, 0.6), color: Math.random() < 0.5 ? '#ff9b40' : '#ff5d2e', size: rand(2, 5) });
      }
    }
  }
  // 나기니의 습격: 선회하는 두 마리 뱀
  if (player.snakeT > 0) {
    player.snakeT -= dt;
    const SR = 68;
    for (let s = 0; s < 2; s++) {
      const a = G.time * 4.2 + s * Math.PI;
      const sx = player.x + Math.cos(a) * SR, sy = player.y + Math.sin(a) * SR;
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if ((e.snakeCd || 0) > G.time) continue;
        if (dist2(sx, sy, e.x, e.y) < (16 + e.r) * (16 + e.r)) {
          e.snakeCd = G.time + 0.25;
          damageEnemy(e, st.dmg * 1.6);
        }
      }
      for (let i = G.clones.length - 1; i >= 0; i--) {
        const c = G.clones[i];
        if ((c.snakeCd || 0) > G.time) continue;
        if (dist2(sx, sy, c.x, c.y) < (16 + c.r) * (16 + c.r)) {
          c.snakeCd = G.time + 0.25;
          damageClone(c, st.dmg * 1.6);
        }
      }
      if (G.boss && !G.boss.entering && (G.boss.snakeCd || 0) <= G.time) {
        if (dist2(sx, sy, G.boss.x, G.boss.y) < (16 + G.boss.r) * (16 + G.boss.r)) {
          G.boss.snakeCd = G.time + 0.3;
          damageEnemy(G.boss, st.dmg * 1.3, true);
        }
      }
    }
  }
  // 어둠의 표식: 시전 후 전체 광역
  if (G.darkmark) {
    G.darkmark.t -= dt;
    if (!G.darkmark.fired && G.darkmark.t <= 0.55) {
      G.darkmark.fired = true;
      G.flash = 0.7;
      shake(16);
      for (let i = enemies.length - 1; i >= 0; i--) damageEnemy(enemies[i], st.dmg * 18);
      for (let i = G.clones.length - 1; i >= 0; i--) damageClone(G.clones[i], st.dmg * 18);
      if (G.boss && !G.boss.entering) damageEnemy(G.boss, st.dmg * 8, true);
    }
    if (G.darkmark && G.darkmark.t <= 0) G.darkmark = null;
  }
  if (G.crucioT > 0) G.crucioT -= dt;
  if (player.shieldT > 0) player.shieldT -= dt;
  if (player.disarmT > 0) player.disarmT -= dt;
}

/* ==================== [웨이브] ==================== */

const Spawner = { queue: [], t: 0 };

// 스테이지가 진행될수록 새 병종이 순차 등장
const STAGE_MIX = [
  [['auror', .8], ['order', .2]],
  [['auror', .5], ['order', .25], ['broom', .25]],
  [['auror', .35], ['order', .25], ['broom', .15], ['splitter', .25]],
  [['auror', .3], ['order', .2], ['broom', .15], ['splitter', .15], ['sniper', .2]],
  [['auror', .25], ['order', .18], ['guardian', .12], ['splitter', .15], ['sniper', .15], ['shielder', .15]],
  [['auror', .2], ['order', .15], ['guardian', .13], ['broom', .15], ['splitter', .14], ['sniper', .11], ['shielder', .12]],
  [['auror', .18], ['order', .15], ['guardian', .14], ['broom', .15], ['splitter', .14], ['sniper', .12], ['shielder', .12]],
];

function pickType(stage) {
  const mix = STAGE_MIX[stage];
  let r = Math.random();
  for (const [type, w] of mix) {
    if (r < w) return type;
    r -= w;
  }
  return mix[0][0];
}

function waveMix(stage, wave) {
  const mix = [];
  const count = 7 + stage * 2 + wave * 2;
  for (let i = 0; i < count; i++) mix.push(pickType(stage));
  return mix;
}

function startWave(w) {
  G.wave = w;
  const mix = waveMix(G.stage, w);
  const dur = 17 + w * 2.5;
  Spawner.queue = mix.map((type, i) => ({ type, at: (i / mix.length) * dur + rand(0, 0.8) }));
  Spawner.t = 0;
  banner('웨이브 ' + w + ' / 5', '');
  updateHUDStage();
}

function updateSpawner(dt) {
  if (!Spawner.queue.length) return;
  Spawner.t += dt;
  while (Spawner.queue.length && Spawner.queue[0].at <= Spawner.t) {
    if (enemies.length >= 14) { Spawner.queue[0].at += 0.8; break; }
    let type = Spawner.queue.shift().type;
    // 결계술사는 동시에 2기까지만
    if (type === 'shielder' && enemies.filter(e => e.type === 'shielder').length >= 2) type = 'auror';
    spawnEnemy(type);
  }
}

function checkWaveEnd() {
  if (G.pending || player.dead) return;
  if (Spawner.queue.length || enemies.length || G.boss) return;
  if (G.wave < 5) {
    schedule(1.4, () => startWave(G.wave + 1));
  } else if (G.wave === 5) {
    G.wave = 6;
    updateHUDStage();
    const bd = BOSSES[STAGES[G.stage].bossKey];
    banner(bd.name, '"' + bd.line + '"');
    schedule(2.6, spawnBoss);
  }
}

/* ==================== [업데이트: 엔티티] ==================== */

function updatePlayer(dt) {
  if (player.dead) return;
  const st = stats();
  player.maxhp = st.maxhp;
  const prevX = player.x;
  if (Input.drag) {
    const dx = Input.tx - player.x, dy = Input.ty - player.y;
    const d = Math.hypot(dx, dy);
    if (d > 0.5) {
      const step = Math.min(d, st.speed * dt);
      player.x += (dx / d) * step;
      player.y += (dy / d) * step;
    }
  }
  player.x = clamp(player.x, 22, W - 22);
  player.y = clamp(player.y, H * 0.32, H - 46);
  // 이동 기울기 연출용 부드러운 수평 속도
  const vx = dt > 0 ? (player.x - prevX) / dt : 0;
  player.vxSm += (vx - player.vxSm) * Math.min(1, dt * 9);
  // 자동 공격 (무장해제 시 정지)
  player.fireT -= dt;
  if (player.fireT <= 0 && player.disarmT <= 0 && (enemies.length || G.clones.length || (G.boss && !G.boss.entering))) {
    player.fireT = st.fireInt;
    fireBolt();
  }
  if (player.wandT > 0) player.wandT -= dt;
  if (player.hitFlash > 0) player.hitFlash -= dt;
}

function updateEnemies(dt) {
  // 결계술사 오라 갱신: 매 프레임 재계산
  let hasShielder = false;
  for (const e of enemies) { e.shielded = false; if (e.type === 'shielder') hasShielder = true; }
  if (hasShielder) {
    for (const s of enemies) {
      if (s.type !== 'shielder' || s.stunT > 0) continue;
      const rr = s.shieldR * s.shieldR;
      for (const e of enemies) {
        if (e === s || e.type === 'shielder') continue;
        if (dist2(s.x, s.y, e.x, e.y) < rr) e.shielded = true;
      }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.t += dt;
    if (e.hitT > 0) e.hitT -= dt;
    // 크루시아투스 도트
    if (e.dotT > 0) {
      e.dotT -= dt;
      damageEnemy(e, e.dotDps * dt);
      if (enemies[i] !== e) continue; // 도트로 사망해 제거됨
      if (Math.random() < dt * 6) addParticles(e.x, e.y, 1, '#ff4d5e', 60, 0.4, 3);
    }
    // 기절: 이동/공격 정지
    if (e.stunT > 0) { e.stunT -= dt; continue; }

    if (e.type === 'auror') {
      e.y += e.spd * dt;
      e.x += Math.sin(e.t * 2.4) * 34 * dt + clamp(player.x - e.x, -60, 60) * 0.55 * dt;
    } else if (e.type === 'order') {
      if (e.y < e.stopY) e.y += e.spd * dt * 1.6;
      else {
        e.x += Math.sin(e.t * 1.3) * 42 * dt;
        e.y += Math.sin(e.t * 0.8) * 12 * dt;
        e.fireT -= dt;
        if (e.fireT <= 0 && !player.dead) {
          e.fireT = rand(1.7, 2.6) * Math.max(0.55, 1 - G.stage * 0.05);
          const a = Math.atan2(player.y - e.y, player.x - e.x);
          ebullets.push({ x: e.x, y: e.y + 8, vx: Math.cos(a) * 210, vy: Math.sin(a) * 210, dmg: e.dmg, r: 6, color: '#8ab4ff', life: 5 });
          Snd.play('shoot');
        }
      }
    } else if (e.type === 'guardian') {
      const a = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(a) * e.spd * dt;
      e.y += Math.sin(a) * e.spd * dt;
    } else if (e.type === 'broom') {
      // 사인 곡선 급습 — 좌우로 화면을 가로지른다
      e.x += e.vx * dt;
      e.y = e.baseY + Math.sin(e.t * 3.4) * e.amp;
      if ((e.vx > 0 && e.x > W + 40) || (e.vx < 0 && e.x < -40)) {
        if (e.crossings < 1) {
          e.crossings++;
          e.vx = -e.vx;
          e.baseY = clamp(e.baseY + rand(60, 110), H * 0.1, H * 0.55);
        } else {
          enemies.splice(i, 1);
          continue;
        }
      }
    } else if (e.type === 'shielder') {
      if (e.y < e.stopY) e.y += e.spd * dt * 1.5;
      else {
        e.x += Math.sin(e.t * 0.9) * 26 * dt;
        e.y += Math.sin(e.t * 0.7) * 8 * dt;
      }
    } else if (e.type === 'splitter') {
      e.y += e.spd * dt * (e.gen === 2 ? 1.15 : 0.85);
      e.x += Math.sin(e.t * (e.gen === 2 ? 3.4 : 1.9)) * 46 * dt;
    } else if (e.type === 'sniper') {
      if (e.y < e.stopY) e.y += e.spd * dt;
      else {
        // 조준 → 고정 → 발사 사이클 (조준선 예고)
        if (e.aim) {
          e.aim.t -= dt;
          if (e.aim.state === 'track') {
            e.aim.ang = Math.atan2(player.y - e.y, player.x - e.x);
            if (e.aim.t <= 0) { e.aim.state = 'lock'; e.aim.t = 0.3; }
          } else if (e.aim.state === 'lock') {
            if (e.aim.t <= 0) {
              if (!player.dead) {
                ebullets.push({ x: e.x, y: e.y, vx: Math.cos(e.aim.ang) * 470, vy: Math.sin(e.aim.ang) * 470, dmg: e.dmg, r: 6, color: '#ffe27a', life: 4 });
                Snd.play('snipe');
              }
              e.aim = null;
              e.aimCd = rand(1.5, 2.4);
            }
          }
        } else {
          e.aimCd -= dt;
          if (e.aimCd <= 0 && !player.dead) e.aim = { state: 'track', t: 1.0, ang: 0 };
        }
      }
    } else if (e.type === 'chess') {
      e.y += e.spd * dt;
      if (e.y > H + 50) { enemies.splice(i, 1); continue; }
    }

    if (e.type !== 'broom') e.x = clamp(e.x, 16, W - 16);
    // 화면 아래로 지나가면 위로 재진입 (교착 방지 · 체스말/빗자루 제외)
    if (e.y > H + 60 && e.type !== 'chess' && e.type !== 'broom') { e.y = -50; e.x = rand(30, W - 30); }
    // 플레이어 접촉
    if (!player.dead && dist2(e.x, e.y, player.x, player.y) < (e.r + player.r) * (e.r + player.r)) {
      if (e.type === 'guardian' || e.type === 'chess') {
        e.touchT = (e.touchT || 0) - dt;
        if (e.touchT <= 0) { e.touchT = 0.6; hurtPlayer(e.dmg * 0.6); }
      } else {
        hurtPlayer(e.dmg);
        addParticles(e.x, e.y, 12, '#8a5a9a', 170, 0.6, 4);
        enemies.splice(i, 1);
        continue;
      }
    }
  }
}

/* ==================== [보스] ==================== */

function startBossSig(b, phase2) {
  let name = b.sigName;
  if (b.key === 'dumbledore' && phase2) name = 'phoenix';
  const TELE = { laser: 0.9, clones: 0.7, dogcharge: 0.8, chess: 0.85, xslash: 0.8, disarm: 0.7, firestorm: 0.9, phoenix: 0.9 }[name];
  b.sig = { name, state: 'tele', t: TELE, teleDur: TELE };
  if (name === 'laser') b.sig.ang = Math.atan2(player.y - b.y, player.x - b.x);
  if (name === 'chess') {
    const cx = clamp(player.x, 70, W - 70);
    b.sig.cols = [clamp(cx - 90, 30, W - 30), cx, clamp(cx + 90, 30, W - 30)];
  }
  if (name === 'xslash') { b.sig.cx = player.x; b.sig.cy = player.y; }
  if (name === 'phoenix') b.sig.px = player.x;
  Snd.play('ui');
}

function execBossSig(b, phase2) {
  const s = b.sig;
  s.state = 'exec';
  switch (s.name) {
    case 'laser':
      s.t = 1.3;
      Snd.play('laser');
      break;
    case 'clones': {
      const m = 1 + 0.2 * G.stage;
      for (const mx of [W - b.x, clamp(b.x + (b.x < W / 2 ? 150 : -150), 40, W - 40)]) {
        G.clones.push({ key: b.key, ghost: true, x: mx, y: b.y + 26, r: 24, hp: 90 * m, maxhp: 90 * m, fireT: 0.9, life: 7, t: rand(0, 6.28), hitT: 0, phase: 1, entering: false, telegraph: 0 });
      }
      addParticles(b.x, b.y, 20, '#e07bff', 200, 0.7, 4);
      Snd.play('boss');
      s.t = 0.2;
      break;
    }
    case 'dogcharge':
      b.dogMode = true;
      s.dashN = 0; s.phase = 'aim'; s.t = 0.15;
      Snd.play('boss');
      break;
    case 'chess':
      for (const cx of s.cols) {
        if (enemies.length < 13) spawnEnemy('chess', { x: cx });
      }
      shake(6);
      Snd.play('boss');
      s.t = 0.2;
      break;
    case 'xslash':
      s.t = 0.4;
      s.hitDone = false;
      Snd.play('slash');
      // 참격선을 따라 흐르는 탄
      for (const sgn of [[1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        for (const sp of [150, 260]) {
          ebullets.push({ x: s.cx, y: s.cy, vx: sgn[0] * sp * 0.707, vy: sgn[1] * sp * 0.707, dmg: b.dmg * 0.5, r: 6, color: '#b8b8d8', life: 3 });
        }
      }
      break;
    case 'disarm': {
      const a = Math.atan2(player.y - b.y, player.x - b.x);
      ebullets.push({ x: b.x, y: b.y + 8, vx: Math.cos(a) * 330, vy: Math.sin(a) * 330, dmg: 8, r: 9, color: '#ff6a5a', life: 5, disarm: true });
      Snd.play('disarm');
      s.t = 0.2;
      break;
    }
    case 'firestorm':
      s.t = 1.3; s.emit = 0; s.ang0 = rand(0, 6.28);
      Snd.play('fire');
      break;
    case 'phoenix':
      G.phoenix = { x: s.px, y: -70, vy: 740, r: 26, hitDone: false };
      Snd.play('phoenix');
      s.t = 0.3;
      break;
  }
}

function updateBossSig(b, dt, phase2) {
  const s = b.sig;
  s.t -= dt;
  if (s.state === 'tele') {
    b.telegraph = 1 - Math.max(0, s.t) / s.teleDur;
    if (s.name === 'laser') {
      // 조준선이 플레이어를 천천히 추적
      const want = Math.atan2(player.y - b.y, player.x - b.x);
      let d = want - s.ang;
      while (d > Math.PI) d -= 6.283;
      while (d < -Math.PI) d += 6.283;
      s.ang += clamp(d, -1.2 * dt, 1.2 * dt);
    }
    if (s.t <= 0) { b.telegraph = 0; execBossSig(b, phase2); }
    return;
  }
  // exec
  if (s.name === 'laser') {
    const want = Math.atan2(player.y - b.y, player.x - b.x);
    let d = want - s.ang;
    while (d > Math.PI) d -= 6.283;
    while (d < -Math.PI) d += 6.283;
    s.ang += clamp(d, -0.55 * dt, 0.55 * dt); // 천천히 쓸어오는 추적 레이저
    if (!player.dead) {
      // 광선(반직선)과 플레이어 거리
      const dx = player.x - b.x, dy = player.y - b.y;
      const proj = dx * Math.cos(s.ang) + dy * Math.sin(s.ang);
      if (proj > 0) {
        const perp = Math.abs(-dx * Math.sin(s.ang) + dy * Math.cos(s.ang));
        if (perp < 26) {
          b.laserTick = (b.laserTick || 0) - dt;
          if (b.laserTick <= 0) { b.laserTick = 0.25; hurtPlayer(b.dmg * 0.45); }
        }
      }
    }
  } else if (s.name === 'dogcharge') {
    if (s.phase === 'aim') {
      if (s.t <= 0) {
        const a = Math.atan2(player.y - b.y, player.x - b.x);
        s.vx = Math.cos(a) * 560; s.vy = Math.sin(a) * 560;
        s.phase = 'dash'; s.t = 0.42;
        shake(4);
      }
    } else if (s.phase === 'dash') {
      b.x += s.vx * dt; b.y += s.vy * dt;
      b.x = clamp(b.x, 30, W - 30); b.y = clamp(b.y, 40, H - 60);
      if (!player.dead && dist2(b.x, b.y, player.x, player.y) < (b.r + player.r) * (b.r + player.r)) {
        b.touchT -= dt;
        if (b.touchT <= 0) { b.touchT = 0.5; hurtPlayer(b.dmg); }
      }
      if (Math.random() < dt * 30) addParticles(b.x, b.y + 8, 1, '#22222e', 60, 0.4, 4);
      if (s.t <= 0) {
        s.dashN++;
        if (s.dashN >= 3) { b.dogMode = false; b.sig = null; b.sigT = b.sigCd; b.returning = true; return; }
        s.phase = 'aim'; s.t = 0.24;
      }
    }
    return;
  } else if (s.name === 'xslash') {
    if (!s.hitDone && !player.dead) {
      // 두 대각선(45°/-45°)과 플레이어 거리
      const dx = player.x - s.cx, dy = player.y - s.cy;
      const d1 = Math.abs(dx - dy) * 0.707, d2 = Math.abs(dx + dy) * 0.707;
      if (Math.min(d1, d2) < 24) {
        s.hitDone = true;
        hurtPlayer(b.dmg * 1.2);
      }
    }
  } else if (s.name === 'firestorm') {
    s.emit -= dt;
    if (s.emit <= 0) {
      s.emit = 0.09;
      s.ang0 += 0.5;
      for (let k = 0; k < 3; k++) {
        const a = s.ang0 + k * 2.094;
        ebullets.push({ x: b.x, y: b.y, vx: Math.cos(a) * 185, vy: Math.sin(a) * 185, dmg: b.dmg * 0.45, r: 6, color: '#ff9b40', life: 5 });
      }
    }
  }
  if (s.t <= 0) { b.sig = null; b.sigT = b.sigCd; }
}

function updateBoss(dt) {
  const b = G.boss; if (!b) return;
  b.t += dt;
  if (b.hitT > 0) b.hitT -= dt;
  if (b.entering) {
    b.y += (b.ty - b.y) * Math.min(1, dt * 2.2);
    if (Math.abs(b.y - b.ty) < 4) b.entering = false;
    return;
  }
  const phase2 = b.hp < b.maxhp * 0.5;
  if (phase2 && b.phase === 1) {
    b.phase = 2;
    banner('', b.key === 'dumbledore' ? '불사조가 눈을 뜬다…' : '어둠이 짙어진다…');
    Snd.play('boss'); shake(8);
  }
  // 크루시아투스 도트/기절
  if (b.dotT > 0) {
    b.dotT -= dt;
    damageEnemy(b, b.dotDps * dt, true);
    if (!G.boss) return; // 도트로 처치됨
  }
  if (b.stunT > 0) { b.stunT -= dt; b.telegraph = 0; return; }

  const spdMul = phase2 ? 1.45 : 1;

  // 시그니처 패턴 상태 머신
  if (b.sig) {
    updateBossSig(b, dt, phase2);
    if (!G.boss) return;
  } else {
    b.sigT -= dt * (phase2 ? 1.25 : 1);
    if (b.sigT <= 0 && !b.dashing && !b.returning && !player.dead) startBossSig(b, phase2);
  }

  const sigHold = b.sig && (b.sig.name === 'dogcharge' && b.sig.state === 'exec');
  if (!sigHold) {
    if (b.dashing > 0) {
      b.dashing -= dt;
      b.x += b.dashVX * dt; b.y += b.dashVY * dt;
      if (!player.dead && dist2(b.x, b.y, player.x, player.y) < (b.r + player.r) * (b.r + player.r)) {
        b.touchT -= dt;
        if (b.touchT <= 0) { b.touchT = 0.5; hurtPlayer(b.dmg); }
      }
      if (b.dashing <= 0) { b.returning = true; }
    } else if (b.returning) {
      const tx = W / 2 + Math.sin(b.swayT * 0.7) * (W * 0.3), ty = H * 0.2;
      b.x += (tx - b.x) * dt * 2; b.y += (ty - b.y) * dt * 2;
      if (Math.abs(b.y - ty) < 10) b.returning = false;
    } else if (!b.sig) {
      b.swayT += dt * spdMul;
      b.x = W / 2 + Math.sin(b.swayT * 0.7) * (W * 0.32);
      b.y = b.ty + Math.sin(b.t * 1.1) * 16;
    }
  }

  // 접촉 피해 (일반 상태)
  if (!player.dead && dist2(b.x, b.y, player.x, player.y) < (b.r + player.r) * (b.r + player.r)) {
    b.touchT -= dt;
    if (b.touchT <= 0) { b.touchT = 0.55; hurtPlayer(b.dmg * 0.8); }
  }

  // 기본 공격 패턴 (시그니처 시전 중에는 정지)
  if (!b.sig) {
    b.fireT -= dt * spdMul;
    if (b.fireT <= 0 && !player.dead && !b.returning) {
      const ps = b.patterns;
      const pick = ps[Math.floor(Math.random() * ps.length)];
      if (pick === 'aim') {
        b.fireT = phase2 ? 1.1 : 1.7;
        const a = Math.atan2(player.y - b.y, player.x - b.x);
        const n = phase2 ? 3 : 2;
        for (let i = 0; i < n; i++) {
          const aa = a + (i - (n - 1) / 2) * 0.22;
          ebullets.push({ x: b.x, y: b.y + 10, vx: Math.cos(aa) * 250, vy: Math.sin(aa) * 250, dmg: b.dmg * 0.65, r: 7, color: '#e07bff', life: 6 });
        }
        Snd.play('shoot');
      } else if (pick === 'spread') {
        b.fireT = phase2 ? 2.0 : 2.8;
        const n = phase2 ? 14 : 10;
        const off = rand(0, 6.28);
        for (let i = 0; i < n; i++) {
          const a = off + (i / n) * 6.283;
          ebullets.push({ x: b.x, y: b.y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, dmg: b.dmg * 0.5, r: 6, color: '#ff8ad2', life: 6 });
        }
        Snd.play('fire');
      } else if (pick === 'dash') {
        b.fireT = 3.2;
        const a = Math.atan2(player.y - b.y, player.x - b.x);
        b.dashVX = Math.cos(a) * 430; b.dashVY = Math.sin(a) * 430;
        b.dashing = 0.75;
        Snd.play('boss');
        shake(4);
      } else if (pick === 'summon') {
        b.fireT = phase2 ? 3.0 : 4.2;
        if (enemies.length < 10) {
          const n = phase2 ? 3 : 2;
          for (let i = 0; i < n; i++) {
            // 해리는 패트로누스(수호자)를 부른다
            spawnEnemy(b.key === 'harry' ? 'guardian' : (Math.random() < 0.7 ? 'auror' : 'order'));
          }
          addParticles(b.x, b.y, 16, '#e07bff', 180, 0.7, 4);
          Snd.play('ui');
        }
      }
    }
  }
  document.getElementById('bossFill').style.width = Math.max(0, (b.hp / b.maxhp) * 100) + '%';
}

function updateClones(dt) {
  for (let i = G.clones.length - 1; i >= 0; i--) {
    const c = G.clones[i];
    c.t += dt; c.life -= dt;
    if (c.hitT > 0) c.hitT -= dt;
    if (c.life <= 0) {
      G.clones.splice(i, 1);
      addParticles(c.x, c.y, 14, '#e07bff', 160, 0.6, 4);
      continue;
    }
    c.x += Math.sin(c.t * 1.4) * 40 * dt;
    c.y += Math.sin(c.t * 0.9) * 10 * dt;
    c.x = clamp(c.x, 30, W - 30);
    c.fireT -= dt;
    if (c.fireT <= 0 && !player.dead) {
      c.fireT = 1.3;
      const a = Math.atan2(player.y - c.y, player.x - c.x);
      ebullets.push({ x: c.x, y: c.y + 8, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, dmg: (G.boss ? G.boss.dmg : 20) * 0.5, r: 6, color: '#e07bff', life: 5 });
      Snd.play('shoot');
    }
  }
}

function updatePhoenix(dt) {
  const p = G.phoenix; if (!p) return;
  p.y += p.vy * dt;
  if (particles.length < MAXP - 4) {
    for (let k = 0; k < 3; k++) {
      particles.push({ x: p.x + rand(-16, 16), y: p.y - rand(0, 30), vx: rand(-40, 40), vy: rand(-60, -10), t: 0, life: rand(0.3, 0.6), color: Math.random() < 0.5 ? '#ff9b40' : '#ffe27a', size: rand(2, 5) });
    }
  }
  if (!p.hitDone && !player.dead && dist2(p.x, p.y, player.x, player.y) < (p.r + player.r) * (p.r + player.r)) {
    p.hitDone = true;
    hurtPlayer(30 * dmgMul());
  }
  if (p.y > H + 90) G.phoenix = null;
}

/* ==================== [탄환/픽업/파티클] ==================== */

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const p = bullets[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.life <= 0 || p.x < -20 || p.x > W + 20 || p.y < -30 || p.y > H + 30) { bullets.splice(i, 1); continue; }
    let hit = false;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (dist2(p.x, p.y, e.x, e.y) < (p.r + e.r) * (p.r + e.r)) {
        damageEnemy(e, p.dmg);
        addParticles(p.x, p.y, 4, '#7CFF6B', 110, 0.35, 3);
        hit = true; break;
      }
    }
    if (!hit) {
      for (let j = G.clones.length - 1; j >= 0; j--) {
        const c = G.clones[j];
        if (dist2(p.x, p.y, c.x, c.y) < (p.r + c.r) * (p.r + c.r)) {
          damageClone(c, p.dmg);
          addParticles(p.x, p.y, 4, '#e07bff', 110, 0.35, 3);
          hit = true; break;
        }
      }
    }
    if (!hit && G.boss && !G.boss.entering) {
      const b = G.boss;
      if (dist2(p.x, p.y, b.x, b.y) < (p.r + b.r) * (p.r + b.r)) {
        damageEnemy(b, p.dmg, true);
        addParticles(p.x, p.y, 4, '#7CFF6B', 110, 0.35, 3);
        hit = true;
      }
    }
    if (hit) bullets.splice(i, 1);
  }
}

function updateEBullets(dt) {
  for (let i = ebullets.length - 1; i >= 0; i--) {
    const p = ebullets[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.life <= 0 || p.x < -30 || p.x > W + 30 || p.y < -40 || p.y > H + 40) { ebullets.splice(i, 1); continue; }
    if (!player.dead && dist2(p.x, p.y, player.x, player.y) < (p.r + player.r - 4) * (p.r + player.r - 4)) {
      if (p.disarm && player.shieldT <= 0) {
        player.disarmT = 3;
        addText(player.x, player.y - 36, '무장해제!', '#ff8a7a', true);
      }
      hurtPlayer(p.dmg);
      ebullets.splice(i, 1);
    }
  }
}

function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const s = pickups[i];
    s.t += dt;
    if (s.t < 0.35) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 220 * dt;
    } else {
      const dx = player.x - s.x, dy = player.y - s.y;
      const d = Math.hypot(dx, dy) || 1;
      const sp = 320 + s.t * 500;
      s.x += (dx / d) * sp * dt; s.y += (dy / d) * sp * dt;
      if (d < 26) {
        pickups.splice(i, 1);
        Save.data.souls++;
        G.runSouls++;
        if (Math.random() < 0.4) Snd.play('soul');
        continue;
      }
    }
    if (s.t > 8) pickups.splice(i, 1);
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.t += dt;
    if (p.t >= p.life) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= (1 - 1.6 * dt); p.vy *= (1 - 1.6 * dt);
  }
}

function updateTexts(dt) {
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i];
    t.t += dt; t.y -= 34 * dt;
    if (t.t > 0.9) texts.splice(i, 1);
  }
}

/* ==================== [렌더링: 이펙트] ==================== */

/* 발광 스프라이트 캐시 — shadowBlur/그라디언트를 매 프레임 만들지 않음 (모바일 사파리 성능) */
function makeGlowSprite(size, stops) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g2 = c.getContext('2d');
  const grad = g2.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  g2.fillStyle = grad;
  g2.fillRect(0, 0, size, size);
  return c;
}
const boltSprite = makeGlowSprite(48, [[0, 'rgba(180,255,160,0.95)'], [0.4, 'rgba(90,240,100,0.6)'], [1, 'rgba(60,200,80,0)']]);
const fireSprite = makeGlowSprite(64, [[0, 'rgba(255,200,120,0.9)'], [0.5, 'rgba(255,140,50,0.4)'], [1, 'rgba(255,110,40,0)']]);
const snakeGlow = makeGlowSprite(40, [[0, 'rgba(140,255,170,0.8)'], [1, 'rgba(80,220,120,0)']]);
// 아바다 광선: 가로 그라디언트 스트립 사전 렌더
const beamStrip = (() => {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 2;
  const g2 = c.getContext('2d');
  const lg = g2.createLinearGradient(0, 0, 128, 0);
  lg.addColorStop(0, 'rgba(60,255,90,0)');
  lg.addColorStop(0.5, 'rgba(160,255,150,0.85)');
  lg.addColorStop(1, 'rgba(60,255,90,0)');
  g2.fillStyle = lg;
  g2.fillRect(0, 0, 128, 2);
  return c;
})();
const gemSprite = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g2 = c.getContext('2d');
  g2.translate(16, 16);
  g2.fillStyle = '#baffa0';
  g2.shadowColor = '#7CFF6B'; g2.shadowBlur = 8;
  g2.beginPath(); g2.moveTo(0, -5); g2.lineTo(4, 0); g2.lineTo(0, 5); g2.lineTo(-4, 0); g2.closePath(); g2.fill();
  return c;
})();

function drawTelegraphs() {
  const b = G.boss;
  if (!b || !b.sig) return;
  const s = b.sig;
  const pulse = 0.5 + 0.5 * Math.sin(G.time * 12);
  if (s.name === 'laser' && (s.state === 'tele' || s.state === 'exec')) {
    const len = W + H;
    const ex = b.x + Math.cos(s.ang) * len, ey = b.y + Math.sin(s.ang) * len;
    if (s.state === 'tele') {
      ctx.globalAlpha = 0.25 + 0.3 * pulse;
      ctx.strokeStyle = '#7fd4ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.globalAlpha = 1;
    } else {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = '#7fd4ff'; ctx.lineWidth = 34;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  if (s.name === 'chess' && s.state === 'tele') {
    ctx.globalAlpha = 0.1 + 0.12 * pulse;
    ctx.fillStyle = '#e8e8ff';
    for (const cx of s.cols) ctx.fillRect(cx - 26, 0, 52, H);
    ctx.globalAlpha = 1;
  }
  if (s.name === 'xslash') {
    const L = W + H;
    ctx.save();
    ctx.translate(s.cx, s.cy);
    if (s.state === 'tele') {
      ctx.globalAlpha = 0.3 + 0.35 * pulse;
      ctx.strokeStyle = '#ff6a7a'; ctx.lineWidth = 3;
    } else {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = '#f2f2ff'; ctx.lineWidth = 14;
    }
    ctx.beginPath(); ctx.moveTo(-L * 0.707, -L * 0.707); ctx.lineTo(L * 0.707, L * 0.707); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-L * 0.707, L * 0.707); ctx.lineTo(L * 0.707, -L * 0.707); ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  if (s.name === 'phoenix' && s.state === 'tele') {
    ctx.globalAlpha = 0.12 + 0.14 * pulse;
    ctx.fillStyle = '#ff9b40';
    ctx.fillRect(s.px - 44, 0, 88, H);
    ctx.globalAlpha = 1;
  }
}

function drawSniperAims() {
  for (const e of enemies) {
    if (e.type !== 'sniper' || !e.aim || e.y < e.stopY - 4) continue;
    const len = W + H;
    const ex = e.x + Math.cos(e.aim.ang) * len, ey = e.y + Math.sin(e.aim.ang) * len;
    if (e.aim.state === 'track') {
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 1.5;
    } else {
      ctx.globalAlpha = 0.55 + 0.3 * Math.sin(G.time * 18);
      ctx.strokeStyle = '#ff5d5d'; ctx.lineWidth = 2.2;
    }
    ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawPhoenix() {
  const p = G.phoenix; if (!p) return;
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(fireSprite, p.x - 42, p.y - 42, 84, 84);
  ctx.strokeStyle = 'rgba(255,190,90,0.9)';
  ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 6);
    ctx.quadraticCurveTo(p.x + sgn * 30, p.y - 34, p.x + sgn * 44, p.y - 10);
    ctx.stroke();
  }
  ctx.fillStyle = '#fff3d0';
  ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, 6.283); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}

function drawEffects() {
  ctx.globalCompositeOperation = 'lighter';
  for (const p of bullets) {
    ctx.drawImage(boltSprite, p.x - 10, p.y - 10, 20, 20);
  }
  for (const p of ebullets) {
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.9, 0, 6.283); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // 아바다 케다브라 광선 (사전 렌더 스트립)
  if (player.beamT > 0) {
    const a = Math.min(1, player.beamT / 0.2);
    const bw = 40 + Math.sin(G.time * 40) * 6;
    ctx.globalAlpha = a;
    ctx.drawImage(beamStrip, player.x - bw, 0, bw * 2, player.y - 10);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(235,255,230,' + (0.9 * a) + ')';
    ctx.fillRect(player.x - 6, 0, 12, player.y - 10);
  }
  // 악령의 불 고리
  if (player.ringT > 0) {
    const prog = 1 - player.ringT / SKILLS[1].dur;
    const rr = 40 + prog * Math.min(W, 420) * 0.75;
    const al = 1 - prog;
    ctx.strokeStyle = 'rgba(255,140,50,' + (0.85 * al) + ')';
    ctx.lineWidth = 16 * al + 4;
    ctx.beginPath(); ctx.arc(player.x, player.y, rr, 0, 6.283); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,140,' + (0.7 * al) + ')';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(player.x, player.y, rr * 0.92, 0, 6.283); ctx.stroke();
  }
  // 나기니: 선회하는 두 마리 뱀
  if (player.snakeT > 0) {
    const SR = 68;
    const fade = Math.min(1, player.snakeT / 0.5);
    for (let s = 0; s < 2; s++) {
      const base = G.time * 4.2 + s * Math.PI;
      for (let k = 5; k >= 0; k--) {
        const a = base - k * 0.16;
        const sx = player.x + Math.cos(a) * SR, sy = player.y + Math.sin(a) * SR;
        const sz = k === 0 ? 8 : 6.5 - k * 0.7;
        ctx.globalAlpha = fade * (k === 0 ? 1 : 0.75 - k * 0.09);
        ctx.fillStyle = k === 0 ? '#b8ffc8' : '#5fdc84';
        ctx.beginPath(); ctx.arc(sx, sy, sz, 0, 6.283); ctx.fill();
        if (k === 0) ctx.drawImage(snakeGlow, sx - 20, sy - 20, 40, 40);
      }
    }
    ctx.globalAlpha = 1;
  }
  // 파티클
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  // 영혼 조각
  for (const s of pickups) {
    ctx.drawImage(gemSprite, s.x - 16, s.y - 16);
  }
  // 데미지 숫자
  for (const t of texts) {
    ctx.globalAlpha = Math.max(0, 1 - t.t / 0.9);
    ctx.fillStyle = t.color;
    ctx.font = (t.big ? '800 17px' : '700 13px') + ' -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t.txt, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

function drawOverlays() {
  // 크루시아투스: 붉은 비명 오버레이
  if (G.crucioT > 0) {
    ctx.fillStyle = 'rgba(255,40,60,' + (0.16 * Math.min(1, G.crucioT / 0.4)) + ')';
    ctx.fillRect(0, 0, W, H);
  }
  // 어둠의 표식: 시전 암전 + 충격파 링
  if (G.darkmark) {
    const p = 1 - G.darkmark.t / SKILLS[5].dur;
    ctx.fillStyle = 'rgba(2,6,3,' + (0.45 * Math.sin(p * Math.PI)) + ')';
    ctx.fillRect(0, 0, W, H);
    if (G.darkmark.fired) {
      const q = clamp((0.55 - G.darkmark.t) / 0.55, 0, 1);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 1 - q;
      ctx.strokeStyle = '#7CFF6B';
      ctx.lineWidth = 20 * (1 - q) + 4;
      ctx.beginPath(); ctx.arc(player.x, player.y, 60 + q * Math.max(W, H) * 0.9, 0, 6.283); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}

/* ==================== [UI / 화면 전환] ==================== */

const $ = id => document.getElementById(id);
const SCREENS = ['scrLoading', 'scrTitle', 'scrStory', 'scrShop', 'scrOver', 'scrVictory', 'scrPause'];

function showScreen(id) {
  for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id);
  const inPlay = (id === null);
  $('hud').classList.toggle('hidden', !inPlay && id !== 'scrPause');
  $('skills').classList.toggle('hidden', !inPlay);
}

let bannerTimer = null;
function banner(main, sub) {
  $('bannerMain').textContent = main;
  $('bannerSub').textContent = sub;
  const el = $('banner');
  el.classList.add('show');
  if (bannerTimer) clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function updateHUDStage() {
  const s = STAGES[G.stage];
  $('stageText').textContent = s.title + ' · ' + (G.wave <= 5 ? '웨이브 ' + G.wave + '/5' : '보스전');
}

function refreshSkillIcons() {
  for (let i = 0; i < SKILLS.length; i++) {
    const el = $('sk' + i);
    const locked = !skillUnlocked(i);
    el.classList.toggle('locked', locked);
    // 아이콘 주입 (cool 오버레이는 유지)
    let icon = el.querySelector('svg');
    const html = locked ? ART.ICONS.lock : ART.ICONS[SKILLS[i].key];
    if (!el.dataset.icon || el.dataset.icon !== (locked ? 'lock' : SKILLS[i].key)) {
      if (icon) icon.remove();
      el.insertAdjacentHTML('beforeend', html);
      el.dataset.icon = locked ? 'lock' : SKILLS[i].key;
    }
  }
}

let lastSouls = -1, lastHp = -1;
function updateHUD() {
  if (Save.data.souls !== lastSouls) {
    lastSouls = Save.data.souls;
    $('soulText').textContent = '영혼 조각 ' + lastSouls;
  }
  const hpv = Math.ceil(player.hp);
  if (hpv !== lastHp) {
    lastHp = hpv;
    $('hpFill').style.width = clamp((player.hp / player.maxhp) * 100, 0, 100) + '%';
    $('hpText').textContent = hpv + ' / ' + Math.round(player.maxhp);
  }
  const st = stats();
  for (let i = 0; i < SKILLS.length; i++) {
    const el = $('sk' + i);
    const cool = el.querySelector('.cool');
    if (!skillUnlocked(i)) {
      cool.style.height = '0%';
      el.classList.remove('ready');
      continue;
    }
    const cd = SKILLS[i].cd * st.cdr;
    const pct = skillState[i].t / cd;
    cool.style.height = (pct * 100) + '%';
    el.classList.toggle('ready', pct <= 0 && G.state === 'play');
  }
}

/* ==================== [게임 흐름] ==================== */

function resetStageEntities() {
  enemies.length = 0; bullets.length = 0; ebullets.length = 0;
  particles.length = 0; texts.length = 0; pickups.length = 0; deadFx.length = 0;
  Spawner.queue = [];
  G.boss = null; G.pending = null; G.shake = 0; G.flash = 0;
  G.clones.length = 0; G.phoenix = null; G.crucioT = 0; G.darkmark = null;
  $('bossBar').classList.add('hidden');
  const st = stats();
  player.maxhp = st.maxhp;
  player.hp = st.maxhp;
  player.dead = false;
  player.beamT = 0; player.ringT = 0; player.shieldT = 0;
  player.snakeT = 0; player.disarmT = 0;
  player.x = W / 2; player.y = H * 0.78;
  Input.drag = null;
  for (const s of skillState) s.t = 0;
}

function goTitle() {
  G.state = 'title';
  showScreen('scrTitle');
  $('bossBar').classList.add('hidden'); // 보스전 중 일시정지→타이틀 복귀 시 잔상 방지
  const hasSave = Save.data.started;
  $('btnContinue').classList.toggle('hidden', !hasSave);
  $('btnContinue').textContent = Save.data.cleared
    ? '이어하기 (최종장 재도전)'
    : '이어하기 (' + STAGES[Math.min(Save.data.stage, 6)].title.split(' · ')[0] + ')';
}

/* ---- 스토리: 타자기 연출 ---- */
let storyReadyAt = 0; // 더블탭이 스토리 화면을 즉시 건너뛰는 것 방지
const Story = {
  full: '', pos: 0, node: null, cursor: null, done: false,
  begin(text) {
    this.full = text; this.pos = 0; this.done = false;
    const el = $('storyText');
    el.innerHTML = '';
    this.node = document.createTextNode('');
    this.cursor = document.createElement('span');
    this.cursor.className = 'cursor';
    el.appendChild(this.node);
    el.appendChild(this.cursor);
  },
  update(dt) {
    if (this.done) return;
    this.pos = Math.min(this.full.length, this.pos + dt * 36);
    const n = Math.floor(this.pos);
    if (this.node.data.length !== n) this.node.data = this.full.slice(0, n);
    if (n >= this.full.length) { this.done = true; this.cursor.style.display = 'none'; }
  },
  skip() {
    this.pos = this.full.length;
    this.done = true;
    this.node.data = this.full;
    this.cursor.style.display = 'none';
  },
};

function startStage(i) {
  G.stage = clamp(i, 0, 6);
  G.state = 'story';
  storyReadyAt = performance.now() + 350;
  const s = STAGES[G.stage];
  $('storyTitle').textContent = s.title;
  $('storyPlace').textContent = s.place;
  Story.begin(s.story);
  showScreen('scrStory');
}

function beginPlay() {
  resetStageEntities();
  G.state = 'play';
  G.wave = 0;
  G.runSouls = 0;
  showScreen(null);
  refreshSkillIcons();
  lastHp = -1; lastSouls = -1;
  startWave(1);
}

function stageClear() {
  Save.data.started = true;
  const prevStage = Save.data.stage;
  if (G.stage >= 6) {
    Save.data.cleared = true;
    Save.data.stage = 6;
    Save.write();
    G.state = 'victory';
    $('vicText').textContent = VICTORY_TEXT;
    showScreen('scrVictory');
    return;
  }
  Save.data.stage = Math.max(Save.data.stage, G.stage + 1);
  Save.write();
  // 새 스킬 해금 알림
  let unlockNote = '';
  for (const sk of SKILLS) {
    if (sk.unlock > prevStage && sk.unlock <= Save.data.stage) unlockNote = '새로운 어둠의 마법 해금 — 『' + sk.name + '』';
  }
  openShop(false, unlockNote);
}

function openShop(fromTitle, unlockNote) {
  G.state = 'shop';
  G.shopNext = fromTitle ? Math.min(Save.data.stage, 6) : Math.min(G.stage + 1, 6);
  $('shopStageInfo').textContent = (fromTitle
    ? '다음: ' + STAGES[G.shopNext].title
    : STAGES[G.stage].horcrux + ' 확보 완료 — 다음: ' + STAGES[G.shopNext].title)
    + (unlockNote ? '\n' + unlockNote : '');
  $('shopStageInfo').style.whiteSpace = 'pre-line';
  renderShop();
  showScreen('scrShop');
}

function upCost(u) {
  const lvl = Save.data.up[u.id];
  return Math.round(u.base * Math.pow(u.mult, lvl));
}

function renderShop() {
  $('shopSouls').textContent = '보유 영혼 조각: ' + Save.data.souls;
  const list = $('shopList');
  list.innerHTML = '';
  for (const u of UPGRADES) {
    const lvl = Save.data.up[u.id];
    const maxed = lvl >= u.max;
    const cost = upCost(u);
    const row = document.createElement('div');
    row.className = 'upRow';
    const info = document.createElement('div');
    info.className = 'upInfo';
    info.innerHTML = '<div class="upName">' + u.name + '<span class="upLvl">Lv.' + lvl + '/' + u.max + '</span></div><div class="upDesc">' + u.desc + '</div>';
    const btn = document.createElement('button');
    btn.className = 'upBuy' + (maxed ? ' maxed' : '');
    btn.textContent = maxed ? '최대' : cost + ' 조각';
    btn.disabled = maxed || Save.data.souls < cost;
    btn.addEventListener('click', () => {
      if (Save.data.souls < cost || lvl >= u.max) { Snd.play('deny'); return; }
      Save.data.souls -= cost;
      Save.data.up[u.id]++;
      Save.write();
      Snd.play('buy');
      renderShop();
    });
    row.appendChild(info); row.appendChild(btn);
    list.appendChild(row);
  }
}

function showGameOver() {
  G.state = 'over';
  Save.write(); // 획득한 영혼은 유지
  $('overText').textContent = OVER_LINES[Math.floor(Math.random() * OVER_LINES.length)];
  $('overSouls').textContent = '이번에 모은 영혼 조각 ' + G.runSouls + '개는 그대로 남는다.';
  showScreen('scrOver');
}

function pauseGame() {
  if (G.state !== 'play') return;
  G.state = 'pause';
  showScreen('scrPause');
}
function resumeGame() {
  if (G.state !== 'pause') return;
  G.state = 'play';
  showScreen(null);
}

/* ==================== [메인 루프] ==================== */

let lastT = 0;
function loop(t) {
  requestAnimationFrame(loop);
  const dt = clamp((t - lastT) / 1000, 0, 0.05);
  lastT = t;
  G.time += dt;

  if (G.state === 'play') {
    G.scrollY += SCROLL_SPD * dt; // 상시 종스크롤
    if (G.pending) {
      G.pending.t -= dt;
      if (G.pending.t <= 0) { const fn = G.pending.fn; G.pending = null; fn(); }
    }
    updatePlayer(dt);
    updateSkills(dt);
    updateSpawner(dt);
    updateEnemies(dt);
    updateBoss(dt);
    updateClones(dt);
    updatePhoenix(dt);
    updateBullets(dt);
    updateEBullets(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateTexts(dt);
    updateDeadFx(dt);
    checkWaveEnd();
  } else if (G.state === 'over' || G.state === 'victory') {
    G.scrollY += SCROLL_SPD * 0.22 * dt;
    updateParticles(dt);
    updateTexts(dt);
    updateDeadFx(dt);
  } else if (G.state === 'story') {
    Story.update(dt);
  }

  // ---- 그리기 ----
  ctx.save();
  if (G.shake > 0.2) {
    G.shake *= Math.pow(0.02, dt);
    ctx.translate(rand(-G.shake, G.shake), rand(-G.shake, G.shake));
  } else G.shake = 0;

  if (G.state === 'loading' || G.state === 'title') {
    ART.drawTitleBg(ctx, { W, H, time: G.time });
  } else if (G.state === 'story') {
    ART.drawStoryBg(ctx, { stage: G.stage, W, H, time: G.time });
  } else {
    ART.drawBackground(ctx, { stage: G.stage, scrollY: G.scrollY, time: G.time, W, H });
  }

  const showWorld = (G.state === 'play' || G.state === 'pause' || G.state === 'over');
  if (showWorld) {
    drawTelegraphs();
    drawSniperAims();
    for (const g of deadFx) ART.drawGhost(ctx, g);
    for (const e of enemies) ART.drawEnemy(ctx, e, G.time);
    for (const c of G.clones) ART.drawBoss(ctx, c, G.time);
    if (G.boss) ART.drawBoss(ctx, G.boss, G.time);
    drawPhoenix();
    ART.drawPlayer(ctx, player, G.time);
    drawEffects();
    drawOverlays();
  }
  ctx.restore();

  if (G.flash > 0) {
    ctx.fillStyle = 'rgba(220,255,210,' + (G.flash * 0.6) + ')';
    ctx.fillRect(0, 0, W, H);
    G.flash -= dt * 1.6;
  }

  if (G.state === 'play' || G.state === 'pause') updateHUD();
}

/* ==================== [초기화] ==================== */

function bindUI() {
  const tap = (id, fn) => {
    $(id).addEventListener('click', e => { e.preventDefault(); Snd.unlock(); Snd.play('ui'); fn(); });
  };
  tap('btnNew', () => {
    const keep = Save.data.muted;
    Save.reset();
    Save.data.muted = keep;
    Save.data.started = true;
    Save.write();
    lastSouls = -1;
    startStage(0);
  });
  tap('btnContinue', () => {
    Save.data.started = true;
    openShop(true);
  });
  tap('btnStoryGo', () => { if (performance.now() >= storyReadyAt) beginPlay(); });
  $('scrStory').addEventListener('click', e => {
    if (e.target.id === 'btnStoryGo' || G.state !== 'story') return;
    if (performance.now() < storyReadyAt) return;
    Snd.unlock();
    if (!Story.done) { Story.skip(); return; } // 첫 탭: 텍스트 완성
    Snd.play('ui');
    beginPlay();
  });
  tap('btnShopGo', () => startStage(G.shopNext != null ? G.shopNext : 0));
  tap('btnRetry', () => startStage(G.stage));
  tap('btnOverTitle', goTitle);
  tap('btnVicTitle', goTitle);
  tap('btnResume', resumeGame);
  tap('btnPauseTitle', () => { Save.write(); goTitle(); });
  tap('pauseBtn', () => { if (G.state === 'play') pauseGame(); else if (G.state === 'pause') resumeGame(); });

  const muteBtn = $('muteBtn');
  const refreshMute = () => muteBtn.classList.toggle('off', Snd.muted);
  muteBtn.addEventListener('click', e => {
    e.preventDefault();
    Snd.unlock();
    Snd.setMuted(!Snd.muted);
    refreshMute();
  });
  refreshMute();

  // 스킬 버튼 (터치 반응 우선)
  for (let i = 0; i < SKILLS.length; i++) {
    const el = $('sk' + i);
    const h = e => { e.preventDefault(); e.stopPropagation(); Snd.unlock(); useSkill(i); };
    if (window.PointerEvent) el.addEventListener('pointerdown', h, { passive: false });
    else { el.addEventListener('touchstart', h, { passive: false }); el.addEventListener('mousedown', h); }
  }
  refreshSkillIcons();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G.state === 'play') pauseGame();
    // 복귀 시 iOS가 오디오 컨텍스트를 중단 상태로 남겨둘 수 있으므로 재개 시도
    else if (!document.hidden) {
      if (Snd.ctx && Snd.ctx.state !== 'running') Snd.ctx.resume();
      if (Snd.silentEl && Snd.silentEl.paused) Snd.silentEl.play().catch(() => {});
    }
  });
}

function init() {
  resize();
  ART.load();
  player.x = W / 2;
  player.y = H * 0.78;
  Input.init();
  bindUI();
  requestAnimationFrame(loop);
  // 에셋이 어느 정도 준비되면 타이틀로 (최대 2.5초 대기, 이후 로드는 백그라운드 계속)
  const t0 = performance.now();
  const tryGo = () => {
    if (G.state !== 'loading') return;
    if (ART.progress() >= 0.99 || performance.now() - t0 > 2500) goTitle();
    else setTimeout(tryGo, 150);
  };
  setTimeout(tryGo, 600);
}

init();
