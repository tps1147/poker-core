// WHO SPEAKS EACH V2 FILM, AND WHO PRESENTS IT. The v2 films are narrated, not spoken by a coach:
// Nathan for most tracks, Sarah for Reading People and The Player, Max for Game Theory, Justin for
// every track opener. The coach beside the film (a definition's `coach`, a chapter's `coach`) is the
// presenter, and the presenter's portrait reads as the narrator's gender, so the face matches the
// voice: Knox presents every male-narrated track and every opener; Sera presents People and Mina
// presents the Player. Pure data, no imports: the lesson kits, the curriculum and every client load it.

export const NARRATORS = Object.freeze({
  nathan: Object.freeze({ id: "nathan", name: "Nathan", gender: "m" }),
  sarah: Object.freeze({ id: "sarah", name: "Sarah", gender: "f" }),
  max: Object.freeze({ id: "max", name: "Max", gender: "m" }),
  justin: Object.freeze({ id: "justin", name: "Justin", gender: "m" }),
});

// The narrator of each track's lesson films (a track id from academyTree TRACKS), and of the openers.
export const TRACK_NARRATOR = Object.freeze({
  welcome: "nathan", rules: "nathan", board: "nathan", math: "nathan", preflop: "nathan", postflop: "nathan",
  pressure: "nathan", people: "sarah", theory: "max", player: "sarah", formats: "nathan",
});
export const OPENER_NARRATOR = "justin";

// How each coach's portrait reads (public/academy/coaches). Sera has no portrait yet; she reads female.
export const COACH_GENDER = Object.freeze({ ada: "f", mina: "f", reina: "f", vale: "f", sera: "f", knox: "m" });

// Who presents each track's lessons, and every opener: the same gender as its narrator.
export const TRACK_PRESENTER = Object.freeze({
  welcome: "knox", rules: "knox", board: "knox", math: "knox", preflop: "knox", postflop: "knox",
  pressure: "knox", people: "sera", theory: "knox", player: "mina", formats: "knox",
});
export const OPENER_PRESENTER = "knox";

// A track's narrator id (null for an unknown track).
export const narratorOfTrack = (trackId) => TRACK_NARRATOR[trackId] || null;
