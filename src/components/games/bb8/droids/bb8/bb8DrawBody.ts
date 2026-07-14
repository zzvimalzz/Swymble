// BB-8 body — ported 1:1 from the same ProcessingJS sketch's BODY drawing
// block, see shared/pen.ts for the port's approach. Every coordinate below is
// copied verbatim from the source; only the call syntax changed.
import { CLOSE, type Pen } from '../../shared/pen';
import type { BB8State } from './bb8State';

export function drawBody(p: Pen, state: BB8State) {
  p.pushMatrix();
  // shadow under body
  p.noStroke();
  p.fill(0, 30);
  p.ellipse(295, 443 + state.diameter / 2, state.diameter * 0.9, state.diameter * 0.15);

  p.translate(state.x, state.y);
  p.rotate(state.angle);
  p.translate(-state.x, -state.y);

  // main body
  p.noStroke();
  p.fill(state.colors.white);
  p.ellipse(295, 443, state.diameter, state.diameter);

  // curved rects on body
  p.strokeWeight(1);
  p.stroke(209, 209, 209);
  p.fill(237, 237, 237);
  p.beginShape();
  p.vertex(254, 497);
  p.bezierVertex(259, 493, 262, 491, 268, 490);
  p.bezierVertex(273, 497, 278, 504, 280, 507);
  p.bezierVertex(281, 511, 276, 515, 266, 516);
  p.endShape(CLOSE);
  p.beginShape();
  p.vertex(352, 401);
  p.bezierVertex(357, 401, 362, 403, 366, 405);
  p.bezierVertex(367, 412, 366, 422, 362, 429);
  p.bezierVertex(361, 429, 356, 426, 348, 422);
  p.endShape(CLOSE);

  // full circle on body
  p.noStroke();
  p.fill(state.colors.main);
  p.ellipse(294, 403, 123, 103);
  p.fill(state.colors.white);
  p.ellipse(294, 400, 93, 76);

  // almost triangles
  p.fill(state.colors.main);
  // bottom
  p.beginShape();
  p.vertex(283, 439);
  p.vertex(287, 420);
  p.vertex(296, 420);
  p.vertex(300, 439);
  p.endShape(CLOSE);
  // left
  p.beginShape();
  p.vertex(246, 390);
  p.vertex(266, 391);
  p.vertex(266, 399);
  p.vertex(246, 405);
  p.endShape(CLOSE);
  // top
  p.beginShape();
  p.vertex(289, 361);
  p.vertex(292, 370);
  p.vertex(299, 370);
  p.vertex(303, 361);
  p.endShape(CLOSE);
  // right
  p.beginShape();
  p.vertex(342, 395);
  p.vertex(322, 393);
  p.vertex(321, 402);
  p.vertex(342, 409);
  p.endShape(CLOSE);

  p.fill(state.colors.lightGray);
  // rect under curve on right
  p.beginShape();
  p.vertex(305, 375);
  p.vertex(301, 378);
  p.vertex(314, 389);
  p.vertex(318, 386);
  p.endShape(CLOSE);
  // curved on right
  p.beginShape();
  p.vertex(304, 367);
  p.vertex(301, 373);
  p.vertex(320, 390);
  p.vertex(333, 391);
  p.bezierVertex(330, 381, 319, 370, 305, 367);
  p.endShape(CLOSE);

  // rect under curve on left
  p.beginShape();
  p.vertex(268, 404);
  p.vertex(273, 400);
  p.vertex(285, 411);
  p.vertex(281, 417);
  p.endShape(CLOSE);
  // curve on left
  p.beginShape();
  p.vertex(253, 407);
  p.vertex(267, 401);
  p.vertex(285, 418);
  p.vertex(282, 431);
  p.bezierVertex(270, 428, 259, 420, 253, 407);
  p.endShape(CLOSE);

  // lines in middle
  p.noStroke();
  p.fill(state.colors.lightGray);
  p.beginShape();
  p.vertex(272, 392);
  p.vertex(294, 378);
  p.vertex(317, 399);
  p.vertex(296, 413);
  p.endShape(CLOSE);
  p.strokeWeight(1);
  p.stroke(state.colors.white);
  p.line(284, 379, 312, 405);
  p.line(271, 379, 305, 410);

  // lines on circle
  p.stroke(80);
  p.strokeWeight(1);
  p.line(325, 432, 330, 440);
  p.line(321, 435, 326, 443);
  p.line(317, 437, 321, 445);

  // second circle (bottom left)
  p.noStroke();
  p.fill(state.colors.main);
  p.beginShape();
  p.vertex(193, 457);
  p.bezierVertex(194, 448, 198, 445, 204, 446);
  p.bezierVertex(213, 449, 221, 454, 231, 464);
  p.bezierVertex(246, 480, 254, 491, 260, 501);
  p.bezierVertex(266, 511, 270, 521, 269, 529);
  p.bezierVertex(269, 532, 267, 537, 254, 536);
  p.bezierVertex(242, 532, 228, 521, 217, 508);
  p.bezierVertex(205, 493, 196, 475, 193, 457);
  p.endShape(CLOSE);
  p.fill(state.colors.white);
  p.beginShape();
  p.vertex(197, 471);
  p.bezierVertex(197, 462, 200, 460, 206, 462);
  p.bezierVertex(217, 469, 228, 480, 234, 488);
  p.bezierVertex(243, 500, 248, 509, 252, 519);
  p.bezierVertex(254, 525, 254, 530, 246, 531);
  p.bezierVertex(235, 527, 223, 517, 213, 504);
  p.bezierVertex(203, 492, 199, 478, 197, 471);
  p.endShape(CLOSE);

  // details in second circle
  p.fill(state.colors.main);
  p.beginShape();
  p.vertex(202, 460);
  p.vertex(206, 478);
  p.vertex(209, 478);
  p.vertex(209, 461);
  p.endShape(CLOSE);
  p.beginShape();
  p.vertex(245, 496);
  p.vertex(232, 501);
  p.vertex(236, 507);
  p.vertex(252, 509);
  p.endShape(CLOSE);

  p.fill(state.colors.lightGray);
  p.beginShape();
  p.vertex(211, 468);
  p.vertex(223, 479);
  p.vertex(220, 486);
  p.vertex(211, 477);
  p.endShape(CLOSE);
  p.fill(state.colors.darkGray);
  p.beginShape();
  p.vertex(239, 510);
  p.vertex(246, 511);
  p.bezierVertex(249, 518, 251, 525, 247, 528);
  p.vertex(241, 525);
  p.bezierVertex(242, 521, 243, 519, 239, 510);
  p.endShape(CLOSE);
  // circle in circle
  p.beginShape();
  p.vertex(207, 495);
  p.bezierVertex(205, 488, 204, 485, 208, 482);
  p.bezierVertex(214, 483, 220, 490, 225, 497);
  p.bezierVertex(230, 503, 232, 509, 233, 513);
  p.bezierVertex(232, 516, 231, 520, 226, 518);
  p.bezierVertex(221, 514, 210, 502, 207, 495);
  p.endShape(CLOSE);

  // third circle
  p.fill(state.colors.main);
  p.beginShape();
  p.vertex(393, 470);
  p.bezierVertex(391, 456, 380, 455, 371, 458);
  p.bezierVertex(358, 462, 338, 477, 322, 497);
  p.bezierVertex(311, 514, 304, 525, 308, 534);
  p.bezierVertex(311, 540, 321, 542, 329, 540);
  p.bezierVertex(360, 528, 387, 501, 393, 470);
  p.endShape(CLOSE);
  p.fill(state.colors.white);
  p.beginShape();
  p.vertex(385, 489);
  p.bezierVertex(386, 482, 387, 477, 383, 472);
  p.bezierVertex(373, 470, 360, 477, 351, 485);
  p.bezierVertex(339, 496, 330, 507, 325, 518);
  p.bezierVertex(322, 527, 325, 535, 337, 535);
  p.bezierVertex(359, 526, 375, 510, 385, 489);
  p.endShape(CLOSE);

  // details in third circle
  p.fill(state.colors.main);
  p.beginShape();
  p.vertex(362, 474);
  p.vertex(363, 490);
  p.vertex(357, 495);
  p.vertex(349, 484);
  p.endShape(CLOSE);

  p.beginShape();
  p.vertex(318, 525);
  p.vertex(337, 521);
  p.vertex(338, 524);
  p.vertex(319, 535);
  p.endShape(CLOSE);

  // gray details in circle
  p.fill(state.colors.darkGray);
  p.beginShape();
  p.vertex(337, 518);
  p.vertex(328, 520);
  p.bezierVertex(335, 504, 345, 494, 350, 490);
  p.vertex(354, 496);
  p.bezierVertex(346, 505, 341, 510, 337, 518);
  p.endShape(CLOSE);
  p.beginShape();
  p.vertex(377, 502);
  p.bezierVertex(378, 495, 375, 492, 370, 493);
  p.bezierVertex(360, 496, 352, 502, 348, 509);
  p.bezierVertex(343, 515, 342, 519, 346, 523);
  p.bezierVertex(351, 526, 355, 526, 362, 519);
  p.bezierVertex(367, 515, 374, 509, 377, 502);
  p.endShape(CLOSE);
  // stripes across the dark circle
  p.noFill();
  p.stroke(state.colors.white);
  p.bezier(378, 488, 365, 502, 354, 510, 341, 516);
  p.bezier(377, 494, 364, 508, 352, 516, 341, 521);
  p.bezier(378, 498, 365, 512, 352, 521, 342, 525);

  // curved lines on body connecting the circles
  p.noFill();
  p.strokeWeight(1);
  p.stroke(state.colors.main);
  p.bezier(334, 436, 342, 450, 347, 460, 351, 471);
  p.bezier(251, 434, 242, 445, 235, 455, 230, 465);
  p.bezier(255, 365, 249, 363, 240, 361, 234, 361);
  p.bezier(335, 368, 344, 365, 351, 364, 359, 363);
  p.bezier(269, 529, 279, 533, 292, 534, 308, 532);

  // circles at ends of semi-rects
  p.fill(state.colors.main);
  p.strokeWeight(1);
  p.stroke(40, 50);
  // main circle
  p.ellipse(261, 395, 5, 5);
  p.ellipse(296, 366, 5, 5);
  p.ellipse(326, 398, 5, 5);
  p.ellipse(291.5, 425, 5, 5);
  // second circle (left)
  p.ellipse(206, 474, 2, 3);
  p.ellipse(237, 503, 4, 4);
  // third circle (right)
  p.ellipse(358, 488, 5, 5);
  p.ellipse(334, 524, 1, 2);

  // dots on body
  p.strokeWeight(1);
  p.stroke(209, 209, 209);
  p.fill(237, 237, 237);
  p.ellipse(222, 431, 8, 8);
  p.ellipse(261, 469, 8, 8);
  p.ellipse(290, 515, 8, 8);
  p.ellipse(320, 473, 8, 8);
  p.ellipse(362, 441, 8, 8);
  p.ellipse(364, 388, 8, 8);
  p.ellipse(222, 384, 8, 8);
  p.popMatrix();
}
