// step 32 = 08:00, ~2h into an intensifying synthetic storm. Chosen (by inspecting
// shared/data/simulation.json) because it produces a realistic mix of ok/warn/bad
// areas city-wide with non-trivial forecast countdowns (15-120 min), instead of
// an all-clear or all-flooded moment. Bump this single constant to re-stage the demo.
export const NOW_STEP = 32;
