// BB-8 head — ported 1:1 from the same ProcessingJS sketch's HEAD drawing
// block, see shared/pen.ts for the port's approach. Every coordinate below is
// copied verbatim from the source; only the call syntax changed.
//
// Note: the head rotates by state.headTilt each frame (not the accumulating
// body angle) — a fresh small tilt every frame rather than a spin, which
// reads as the head leaning into the turn while the body rolls underneath
// it. headTilt is an amplified, acceleration-kicked version of speed (see
// moveBB8 in bb8State.ts), so the head snaps toward the new heading a little
// harder right as BB-8 starts moving, then settles into a steady lean.
import { CLOSE, type Pen } from '../../shared/pen';
import type { BB8State } from './bb8State';
import { drawBody } from './bb8DrawBody';

function drawHead(p: Pen, state: BB8State) {
  p.pushMatrix();
  p.translate(state.x, state.y);
  p.rotate(state.headTilt);
  p.translate(-state.x, -state.y);

  // antenna
  p.pushMatrix();
  p.translate(-state.head.x * 0.5, 0);
  p.stroke(state.colors.white);
  p.strokeWeight(2);
  p.line(312, 275, 312, 241);
  p.stroke(0);
  p.line(312, 244, 312, 241);
  p.stroke(state.colors.white);
  p.strokeWeight(1);
  p.line(306, 271, 305, 259);
  p.popMatrix();

  // top part of head
  p.noStroke();
  p.fill(state.colors.white);
  p.arc(295, 335, 132, 135, 185, 357);

  // lines across top of head
  p.noStroke();
  p.fill(144, 172, 197);
  p.beginShape();
  p.vertex(269, 273);
  p.vertex(319, 273);
  p.bezierVertex(323, 273, 327, 275, 335, 281);
  p.vertex(254, 282);
  p.bezierVertex(257, 280, 260, 277, 269, 273);
  p.endShape(CLOSE);

  p.noStroke();
  p.fill(state.colors.main);
  p.quad(247, 288, 341, 287, 345, 291, 244, 291);

  p.pushMatrix();
  p.translate(state.head.x, 0);
  // eyes
  // large
  p.fill(211);
  p.ellipse(263, 303, 39, 39);
  p.fill(0);
  p.ellipse(263, 303, 30, 30);
  p.fill(245);
  p.ellipse(270, 295, 4, 4);
  // small
  p.fill(211);
  p.stroke(0);
  p.ellipse(291, 316, 19, 19);
  p.noStroke();
  p.fill(0);
  p.ellipse(291, 316, 12, 12);
  // red dot
  p.fill(207, 72, 72);
  p.ellipse(263, 308, 6, 6);
  p.popMatrix();

  // shadow under head (on top of body)
  p.fill(0, 80);
  p.arc(state.x, 354, 101, 17, 181, 360);

  // bottom of head
  p.fill(state.colors.white);
  p.beginShape();
  p.vertex(229, 330);
  p.bezierVertex(228, 341, 237, 347, 246, 348);
  p.vertex(343, 348);
  p.bezierVertex(353, 346, 362, 340, 361, 330);
  p.endShape(CLOSE);

  // rects at bottom of head
  p.pushMatrix();
  p.translate(state.head.x, 0);
  p.fill(state.colors.main);
  p.rect(231, 332, 8, 8);
  p.rect(241, 332, 8, 8);
  p.rect(255, 330, 25, 10);
  p.rect(290, 330, 5, 10);
  p.rect(300, 330, 5, 10);
  p.popMatrix();

  // gray stripe at bottom of head
  p.fill(215);
  p.beginShape();
  p.vertex(231, 339);
  p.vertex(359, 339);
  p.bezierVertex(358, 340, 357, 341, 355, 343);
  p.vertex(235, 343);
  p.bezierVertex(233, 342, 232, 341, 231, 339);
  p.endShape(CLOSE);
  p.popMatrix();
}

export function drawBB8(p: Pen, state: BB8State) {
  drawBody(p, state);
  drawHead(p, state);
}
