import { colors } from 'styles/colors'
const pins = {
  startPins: 3,
  pinSize: 2.8,
  pinGap: 28
}

const ball = {
  ballSize: 8
}

const gravityEnv = import.meta.env.VITE_PLINKO_GRAVITY
const engineGravity = gravityEnv !== undefined && gravityEnv !== '' ? parseFloat(gravityEnv) : 0.45

const engine = {
  engineGravity
}

const world = {
  width: 550,
  height: 550
}

export const config = {
  pins,
  ball,
  engine,
  world,
  colors
}
