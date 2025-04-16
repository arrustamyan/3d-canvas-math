export function randomNumber(min = 0, max = 1) {
  return min + (max - min) * ((Math.random() * 100 - 1) / 100)
}
