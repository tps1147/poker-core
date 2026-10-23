// YOUR CHIP (2.0): the base mascot's options. The rig itself (shapes per pose) lives in
// poker-core/world chipRig(); this is the data the server validates a saved character against.
// A later AI character pass replaces the art on the same rig and the same slots.
//
//   CHARACTER_OPTIONS { chips, edges, hats, hatColors, poses }
//   DEFAULT_CHARACTER { chip, edge, hat, hatColor }
//   normalizeCharacter(input) -> a valid character (unknown values fall back to the default)

const CHARACTER_OPTIONS = Object.freeze({
  chips: Object.freeze(['#0984fa', '#3f9b6b', '#c8643b', '#7a5cc8', '#1c1c1c', '#f3ecdf', '#c94f72', '#d6b780']),
  edges: Object.freeze(['#f3ecdf', '#101c2b', '#d6b780']),
  hats: Object.freeze(['none', 'cap', 'top', 'beret', 'crown', 'visor', 'bunny', 'flower', 'helm', 'teacup', 'gem', 'mirror']),
  hatColors: Object.freeze(['#d6b780', '#f3e6cf', '#3f9b6b', '#c94f72', '#3d7fd6', '#1c1c1c', '#4a5568', '#c8643b']),
  poses: Object.freeze(['idle', 'walk', 'cheer', 'think', 'slump', 'allin']),
});

const DEFAULT_CHARACTER = Object.freeze({ chip: '#0984fa', edge: '#f3ecdf', hat: 'cap', hatColor: '#d6b780' });

function normalizeCharacter(input) {
  const c = input && typeof input === 'object' ? input : {};
  const pick = (v, list, d) => (list.includes(v) ? v : d);
  return {
    chip: pick(c.chip, CHARACTER_OPTIONS.chips, DEFAULT_CHARACTER.chip),
    edge: pick(c.edge, CHARACTER_OPTIONS.edges, DEFAULT_CHARACTER.edge),
    hat: pick(c.hat, CHARACTER_OPTIONS.hats, DEFAULT_CHARACTER.hat),
    hatColor: pick(c.hatColor, CHARACTER_OPTIONS.hatColors, DEFAULT_CHARACTER.hatColor),
  };
}

module.exports = { CHARACTER_OPTIONS, DEFAULT_CHARACTER, normalizeCharacter };
