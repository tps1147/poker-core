// THE 2.0 DESIGN KIT, shared ("The World"): the tokens and the geometry both apps draw from, so the
// phone (react-native-svg) and the web (SVG/CSS) cannot drift. Pure data and pure functions; no
// React. `require('poker-core/world')`.
//
//   WORLD_TOKENS[mode]     felt, rail, stitch, lamp, plate, brass plate, 3D button, swirl, for 'dark' | 'light'
//                          (dark: green felt on the brand ground #101c2b; light: navy felt on a cream room)
//   CARD_FACE              the four-color suit gradients, FACE_SHEEN, radius, and the BIG PIP layout
//   CARD_SHEEN             the Sheen finish: 1 px cream edge, the same shadow, a faint gloss every 8 s
//   sealRing(opts)         the 52 ring as 52 segments + four suit marks, in a 120x120 box
//   chipRig(opts)          Your Chip as a list of SVG primitives in a 120x140 box
//   swirlColor(...)        one pixel of the low-res animated swirl ground
//   worldV2Enabled(value)  the WORLD_V2 switch read from an env string ('1' | 'true' | 'on')
//
// House rules carried here: the ground #101c2b never changes; four-color cards; no number is ever
// drawn on the seal.

const GROUND = '#101c2b';

const WORLD_TOKENS = Object.freeze({
  dark: Object.freeze({
    ground: GROUND,
    ink: '#f3ecdf',
    inkMuted: '#b9b3a6',
    brass: '#d6b780',
    brassDeep: '#a8894f',
    cta: '#0984fa',
    felt: Object.freeze({ stops: Object.freeze(['#24675d', '#123a36', '#0a2422']), locations: Object.freeze([0, 0.62, 1]), center: Object.freeze({ x: 0.5, y: 0.35 }) }),
    feltLine: '#d6b78099',     // the thin brass line inside the rail
    feltInset: '#0a1a1a',      // the dark band between rail and line
    stitch: '#d6b78055',       // the dashed stitch, 9 px inside
    lamp: '#f3dfb522',         // the top lamp glow
    rail: Object.freeze({ edge: '#d6b78066', drop: '#060d17', shadow: '#000000cc' }),
    plate: Object.freeze({ from: '#22385a', to: '#13213a', ink: '#f3ecdf', label: '#d6b780', muted: '#b9b3a6', edge: '#f3ecdf80' }),
    plateBrass: Object.freeze({ from: '#ead3a3', to: '#b8975a', ink: '#2a1e08', label: '#5a4320', muted: '#3a2a10', edge: '#f3ecdf80' }),
    button3d: Object.freeze({ blue: Object.freeze({ from: '#2a97ff', to: '#0984fa', lip: '#0657a8', ink: '#ffffff' }), brass: Object.freeze({ from: '#ead3a3', to: '#d6b780', lip: '#8a6c3a', ink: '#2a1e08' }) }),
    swirl: 'dark',
  }),
  light: Object.freeze({
    ground: '#f3eee4',         // the cream room (app/web light --bg)
    ink: '#172738',
    inkMuted: '#53606a',
    brass: '#866438',
    brassDeep: '#6b4f2b',
    cta: '#0984fa',
    felt: Object.freeze({ stops: Object.freeze(['#1b5480', '#0a2c48', '#062038']), locations: Object.freeze([0, 0.62, 1]), center: Object.freeze({ x: 0.5, y: 0.35 }) }),
    feltLine: '#d6b780b3',
    feltInset: '#04182b',
    stitch: '#d6b78066',
    lamp: '#ffffff1f',
    rail: Object.freeze({ edge: '#8e795c66', drop: '#c9bba3', shadow: '#29485933' }),
    plate: Object.freeze({ from: '#fffaf0', to: '#ece3d2', ink: '#172738', label: '#866438', muted: '#53606a', edge: '#8e795c55' }),
    plateBrass: Object.freeze({ from: '#ead3a3', to: '#b8975a', ink: '#2a1e08', label: '#5a4320', muted: '#3a2a10', edge: '#8e795c55' }),
    button3d: Object.freeze({ blue: Object.freeze({ from: '#2a97ff', to: '#0984fa', lip: '#0657a8', ink: '#ffffff' }), brass: Object.freeze({ from: '#ead3a3', to: '#d6b780', lip: '#8a6c3a', ink: '#2a1e08' }) }),
    swirl: 'light',
  }),
});

// The face, unchanged from ModernCard/ShowcaseCard (four-color gradients at 160deg, light to dark).
const CARD_FACE = Object.freeze({
  suits: Object.freeze({
    s: Object.freeze({ glyph: '♠', from: '#585858', to: '#1c1c1c' }),
    h: Object.freeze({ glyph: '♥', from: '#d4552d', to: '#b24221' }),
    d: Object.freeze({ glyph: '♦', from: '#327569', to: '#1e4c41' }),
    c: Object.freeze({ glyph: '♣', from: '#4b5ac7', to: '#2a3b8f' }),
  }),
  angle: 160,
  radius: 0.15,          // of the card width, circular corners
  ratio: 1.4,            // height / width
  sheen: Object.freeze({ colors: Object.freeze(['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.12)']), locations: Object.freeze([0, 0.38, 0.52, 1]) }),
  hairline: 'rgba(255,255,255,0.15)',
  // BIG PIP: the rank top left, an oversized suit bleeding off the lower right. Fractions of the
  // card width (font sizes) or of the box (offsets); rankStretch is a font-stretch percent.
  bigPip: Object.freeze({
    rank: Object.freeze({ left: 0.09, top: 0.06, size: 0.5, weight: 900, stretch: 80, shadow: '0 1px 2px rgba(0,0,0,0.25)' }),
    suit: Object.freeze({ right: -0.14, bottom: -0.16, size: 1.05, opacity: 0.95, shadow: '0 2px 0 rgba(0,0,0,0.19)' }),
  }),
  shadow: Object.freeze({ contact: 0.06, color: 'rgba(0,0,0,0.53)', ambient: '0 6px 14px rgba(0,0,0,0.4)' }),
});

const CARD_SHEEN = Object.freeze({
  edge: '#f3ecdf80',     // 1 px cream ring at 50 %
  glossEveryMs: 8000,
  gloss: Object.freeze({ angle: 115, colors: Object.freeze(['rgba(255,255,255,0)', 'rgba(255,255,255,0.12)', 'rgba(243,223,181,0.08)', 'rgba(255,255,255,0)']), locations: Object.freeze([0.43, 0.49, 0.51, 0.56]) }),
});

// ── the seal ────────────────────────────────────────────────────────────────
const RING_SUITS = Object.freeze([
  Object.freeze({ glyph: '♠', on: '#8a8a8a', off: '#3a3a3a' }),
  Object.freeze({ glyph: '♥', on: '#e06a3e', off: '#5a2412' }),
  Object.freeze({ glyph: '♦', on: '#3fa08e', off: '#143a33' }),
  Object.freeze({ glyph: '♣', on: '#6f7fe6', off: '#1c2660' }),
]);
const RING_GOLD = Object.freeze({ on: '#e6cd9b', off: '#5a4a2a' });

// opts: { lit (0..52) | fill (0..1), gold }. Box 120x120, centre 60,60. Each segment is a 5.6x9
// rounded rect at y 5..14 rotated by `angle` about the centre (index 0 at the top, clockwise).
function sealRing({ lit, fill, gold = false } = {}) {
  const n = Number.isFinite(lit) ? Math.max(0, Math.min(52, Math.round(lit))) : Math.max(0, Math.min(52, Math.round((Number(fill) || 0) * 52)));
  const segments = [];
  for (let i = 0; i < 52; i += 1) {
    const suit = Math.floor(i / 13);
    const on = i < n;
    segments.push({
      i, suit, on, angle: (i / 52) * 360,
      color: gold ? (on ? RING_GOLD.on : RING_GOLD.off) : RING_SUITS[suit][on ? 'on' : 'off'],
      rect: { x: 57.2, y: 5, width: 5.6, height: 9, rx: 1.2 },
    });
  }
  const marks = RING_SUITS.map((s, q) => {
    const a = ((q * 90 + 45) * Math.PI) / 180;
    return { glyph: s.glyph, x: 60 + Math.sin(a) * 44.5, y: 60 - Math.cos(a) * 44.5 + 3, color: gold ? RING_GOLD.on : s.on };
  });
  return { box: 120, lit: n, closed: n >= 52, gold: !!gold, segments, marks, window: { inset: 0.22 }, rim: { r: 47, color: '#d6b780', opacity: 0.5 }, closedRing: { r: 55, color: '#d6b780', width: 1.5 } };
}

// ── Your Chip ───────────────────────────────────────────────────────────────
// opts: { chip, edge, hat, hatColor, pose ('idle'|'walk'|'cheer'|'think'|'slump'|'allin'), eyes ('dot'|'shades'),
// head (true: the face only, for a seat medallion) }. Returns { box: [120, 140], shapes } where each
// shape is { t: 'circle'|'ellipse'|'rect'|'path', ...svg attributes }. fill 'url(#gloss)' means the
// chip's radial gloss (GLOSS); the renderer defines it once under a unique id.
const CREAM = '#f3e6cf';
const FACE_INK = '#0b1522';
const GLOSS = Object.freeze({ cx: '38%', cy: '32%', r: '70%', stops: Object.freeze([['0', '#ffffff', 0.35], ['0.6', '#ffffff', 0], ['1', '#000000', 0.25]]) });

function chipRig(o = {}) {
  const c = o.chip || '#0984fa';
  const e = o.edge || '#f3ecdf';
  const hc = o.hatColor || '#d6b780';
  const pose = o.pose || 'idle';
  const shades = o.eyes === 'shades' || pose === 'allin';
  const S = [];
  const cy = pose === 'slump' ? 76 : 70;
  if (!o.head) {
    const lx = pose === 'walk' ? [-6, 8] : [0, 0];
    S.push({ t: 'ellipse', cx: 60, cy: 134, rx: 30, ry: 4, fill: '#000', opacity: 0.3 });
    S.push({ t: 'rect', x: 44 + lx[0], y: 104, width: 11, height: 26, rx: 5, fill: CREAM });
    S.push({ t: 'rect', x: 65 + lx[1], y: 104, width: 11, height: 26, rx: 5, fill: CREAM });
    S.push({ t: 'ellipse', cx: 49 + lx[0], cy: 130, rx: 9, ry: 5, fill: '#1c2b40' });
    S.push({ t: 'ellipse', cx: 71 + lx[1], cy: 130, rx: 9, ry: 5, fill: '#1c2b40' });
    const arms = {
      idle: [[18, 80, -20], [102, 80, 20]], allin: [[16, 46, 35], [104, 46, -35]], walk: [[18, 78, -35], [102, 82, 30]],
      cheer: [[16, 46, 35], [104, 46, -35]], think: [[18, 80, -20], [86, 64, -60]], slump: [[22, 92, -5], [98, 92, 5]],
    }[pose] || [[18, 80, -20], [102, 80, 20]];
    arms.forEach(([x, y, r]) => S.push({ t: 'ellipse', cx: x, cy: y, rx: 7, ry: 13, fill: CREAM, transform: `rotate(${r} ${x} ${y})` }));
  }
  const R = o.head ? 50 : 42;
  const X = 60;
  const Y = o.head ? 72 : cy;
  S.push({ t: 'circle', cx: X, cy: Y, r: R, fill: c });
  for (let k = 0; k < 12; k += 1) S.push({ t: 'rect', x: X - 4, y: Y - R, width: 8, height: R * 0.22, rx: 2, fill: e, transform: `rotate(${k * 30} ${X} ${Y})` });
  S.push({ t: 'circle', cx: X, cy: Y, r: R * 0.68, fill: 'none', stroke: e, strokeOpacity: 0.55, strokeWidth: 2, strokeDasharray: '4 4' });
  S.push({ t: 'circle', cx: X, cy: Y, r: R, fill: 'url(#gloss)' });
  const ey = Y - R * 0.08;
  const ex = R * 0.28;
  if (shades) {
    S.push({ t: 'rect', x: X - ex - 11, y: ey - 6, width: ex * 2 + 22, height: 11, rx: 5, fill: FACE_INK });
    S.push({ t: 'rect', x: X - ex - 8, y: ey - 4, width: 7, height: 3, rx: 1.5, fill: '#ffffff55' });
  } else if (pose === 'cheer') {
    S.push({ t: 'path', d: `M${X - ex - 5} ${ey + 2} q5 -7 10 0 M${X + ex - 5} ${ey + 2} q5 -7 10 0`, stroke: FACE_INK, strokeWidth: 3, fill: 'none', strokeLinecap: 'round' });
  } else {
    S.push({ t: 'ellipse', cx: X - ex, cy: ey, rx: 4, ry: 5.5, fill: FACE_INK });
    S.push({ t: 'ellipse', cx: X + ex, cy: ey, rx: 4, ry: 5.5, fill: FACE_INK });
    S.push({ t: 'circle', cx: X - ex + 1.5, cy: ey - 2, r: 1.4, fill: '#fff' });
    S.push({ t: 'circle', cx: X + ex + 1.5, cy: ey - 2, r: 1.4, fill: '#fff' });
  }
  const my = Y + R * 0.3;
  if (pose === 'slump') S.push({ t: 'path', d: `M${X - 7} ${my + 3} q7 -4 14 0`, stroke: FACE_INK, strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round' });
  else if (pose === 'think') S.push({ t: 'path', d: `M${X - 5} ${my} h10`, stroke: FACE_INK, strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round' });
  else S.push({ t: 'path', d: `M${X - 8} ${my - 2} q8 ${pose === 'cheer' ? 10 : 7} 16 0`, stroke: FACE_INK, strokeWidth: 2.5, fill: pose === 'cheer' ? '#7a2a2a' : 'none', strokeLinecap: 'round' });
  S.push({ t: 'ellipse', cx: X - ex - 6, cy: my - 3, rx: 5, ry: 3, fill: '#ff8a8a', opacity: 0.35 });
  S.push({ t: 'ellipse', cx: X + ex + 6, cy: my - 3, rx: 5, ry: 3, fill: '#ff8a8a', opacity: 0.35 });
  const ty = Y - R + 4;
  switch (o.hat) {
    case 'cap':
      S.push({ t: 'path', d: `M${X - R * 0.62} ${ty + 4} q${R * 0.62} -${R * 0.55} ${R * 1.24} 0 z`, fill: hc });
      S.push({ t: 'rect', x: X - R * 0.1, y: ty + 1, width: R * 0.95, height: 6, rx: 3, fill: hc, transform: `rotate(-8 ${X} ${ty})` });
      break;
    case 'top':
      S.push({ t: 'rect', x: X - R * 0.42, y: ty - R * 0.62, width: R * 0.84, height: R * 0.66, rx: 3, fill: hc });
      S.push({ t: 'rect', x: X - R * 0.7, y: ty - 2, width: R * 1.4, height: 7, rx: 3, fill: hc });
      S.push({ t: 'rect', x: X - R * 0.42, y: ty - R * 0.18, width: R * 0.84, height: 5, fill: '#c8643b' });
      break;
    case 'beret':
      S.push({ t: 'ellipse', cx: X - 4, cy: ty + 1, rx: R * 0.62, ry: R * 0.22, fill: hc, transform: `rotate(-10 ${X} ${ty})` });
      S.push({ t: 'circle', cx: X - 4, cy: ty - R * 0.2, r: 3, fill: hc });
      break;
    case 'crown':
      S.push({ t: 'path', d: `M${X - R * 0.5} ${ty + 3} l0 -${R * 0.42} l${R * 0.25} ${R * 0.2} l${R * 0.25} -${R * 0.32} l${R * 0.25} ${R * 0.32} l${R * 0.25} -${R * 0.2} l0 ${R * 0.42} z`, fill: hc, stroke: '#8a6c3a', strokeWidth: 1.5 });
      S.push({ t: 'circle', cx: X, cy: ty - R * 0.06, r: 3, fill: '#c94f72' });
      break;
    case 'visor':
      S.push({ t: 'path', d: `M${X - R * 0.6} ${ty + 6} q${R * 0.6} -${R * 0.28} ${R * 1.2} 0`, stroke: hc, strokeWidth: 7, fill: 'none', strokeLinecap: 'round' });
      break;
    case 'bunny':
      S.push({ t: 'ellipse', cx: X - 12, cy: ty - R * 0.35, rx: 6, ry: R * 0.42, fill: hc, transform: `rotate(-12 ${X - 12} ${ty})` });
      S.push({ t: 'ellipse', cx: X + 12, cy: ty - R * 0.35, rx: 6, ry: R * 0.42, fill: hc, transform: `rotate(12 ${X + 12} ${ty})` });
      break;
    case 'flower':
      S.push({ t: 'circle', cx: X + R * 0.4, cy: ty + 4, r: 7, fill: hc });
      S.push({ t: 'circle', cx: X + R * 0.4, cy: ty + 4, r: 3, fill: CREAM });
      break;
    case 'helm':
      S.push({ t: 'path', d: `M${X - R * 0.66} ${ty + 10} q${R * 0.66} -${R * 0.8} ${R * 1.32} 0 z`, fill: hc });
      S.push({ t: 'rect', x: X - 2, y: ty - R * 0.42, width: 4, height: R * 0.3, fill: '#c8643b' });
      break;
    case 'teacup':
      S.push({ t: 'rect', x: X - R * 0.36, y: ty - R * 0.38, width: R * 0.72, height: R * 0.42, rx: 5, fill: hc });
      S.push({ t: 'rect', x: X - R * 0.56, y: ty - 1, width: R * 1.12, height: 5, rx: 2, fill: hc });
      break;
    case 'gem':
      S.push({ t: 'path', d: `M${X} ${ty - R * 0.48} l10 12 l-10 14 l-10 -14 z`, fill: hc, stroke: '#ffffff', strokeOpacity: 0.6 });
      break;
    case 'mirror':
      S.push({ t: 'circle', cx: X, cy: ty - R * 0.18, r: R * 0.24, fill: '#bfe3ff', stroke: hc, strokeWidth: 3 });
      break;
    default:
      break;
  }
  return { box: [120, 140], gloss: GLOSS, shapes: S };
}

// ── the swirl ground ───────────────────────────────────────────────────────
// A slow field in brand navy, teal and a brass glint (dark), or cream with a soft navy and brass
// wash (light). Drawn at about 48x86, scaled up and blurred by the renderer; t in ms.
function swirlColor(x, y, w, h, t, seed = 0, mode = 'dark') {
  const nx = x / w - 0.5;
  const ny = (y / h - 0.45) * 1.6;
  const r = Math.sqrt(nx * nx + ny * ny);
  const a = Math.atan2(ny, nx);
  const tt = t * 0.00018 + seed;
  const v = Math.sin(r * 9 - tt * 3 + a * 2 + Math.sin(a * 3 + tt) * 1.4);
  const v2 = Math.sin(a * 4 - r * 6 + tt * 2);
  const k = v * 0.5 + 0.5;
  const g = v2 * 0.5 + 0.5;
  if (mode === 'light') return [243 - k * 14 - g * g * 6, 238 - k * 10 - g * g * 10, 228 - k * 4 - g * g * 22];
  return [16 + k * 14 + g * g * 40, 28 + k * 42 + g * g * 30, 43 + k * 36 + g * 8];
}

const SWIRL = Object.freeze({ width: 48, height: 86, frameMs: 66, blur: 5, scale: 1.06 });

function worldV2Enabled(value) {
  return ['1', 'true', 'on', 'yes'].includes(String(value == null ? '' : value).trim().toLowerCase());
}

module.exports = {
  WORLD_GROUND: GROUND,
  WORLD_TOKENS,
  CARD_FACE,
  CARD_SHEEN,
  RING_SUITS,
  RING_GOLD,
  sealRing,
  CHIP_GLOSS: GLOSS,
  chipRig,
  SWIRL,
  swirlColor,
  worldV2Enabled,
};
