export function random(min: number, max: number) {
  const randomVal = Math.random()
  min = Math.round(min)
  max = Math.floor(max)

  return randomVal * (max - min) + min
}
