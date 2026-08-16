/* A critically damped spring, integrated in four substeps so it stays stable at low frame
   rates. Everything that eases in this project goes through one of these: gaze, lids, tilt,
   the sleep fade. Nothing is a linear tween, which is most of why the motion reads as alive. */

export class Spring {
  constructor(v, k = 60) {
    this.v = v
    this.vel = 0
    this.k = k
  }

  to(t, dt, k = this.k) {
    const c = 2 * Math.sqrt(k)
    const h = dt / 4
    for (let i = 0; i < 4; i++) {
      this.vel += (k * (t - this.v) - c * this.vel) * h
      this.v += this.vel * h
    }
    return this.v
  }
}
