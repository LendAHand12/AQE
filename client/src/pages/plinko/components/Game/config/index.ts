import { colors } from 'styles/colors'
const pins = {
  startPins: 3,
  pinSize: 2,
  pinGap: 20
}

const ball = {
  ballSize: 5.7
}

const gravityEnv = import.meta.env.VITE_PLINKO_GRAVITY
const engineGravity = gravityEnv !== undefined && gravityEnv !== '' ? parseFloat(gravityEnv) : 0.45

const engine = {
  engineGravity
}

const world = {
  width: 390,
  height: 390
}

export const config = {
  pins,
  ball,
  engine,
  world,
  colors
}
