// Input caps for tools — prevent compute abuse on a small homelab box.
export const BOUNDS = {
  minStrategies: 2,
  maxStrategies: 8, // round-robin is O(n^2) matches
  roundsMin: 1,
  roundsMax: 500,
  roundsDefault: 100,
  errorRateMin: 0,
  errorRateMax: 1,
  swissRoundsMin: 1,
  swissRoundsMax: 12,
} as const
