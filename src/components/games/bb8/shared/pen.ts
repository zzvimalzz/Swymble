// Thin Processing-API-shaped wrapper around Canvas 2D — lets the ported BB-8
// draw calls in bb8DrawBody.ts / bb8DrawHead.ts stay line-for-line comparable
// to the original ProcessingJS sketch (fill/stroke/beginShape/bezierVertex/
// arc/pushMatrix/...), with only the call syntax translated.

export type RGBLike = number | string;

export function pcolor(...args: RGBLike[]): string {
  if (typeof args[0] === 'string') return args[0];
  const nums = args as number[];
  if (nums.length >= 4) return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${nums[3] / 255})`;
  if (nums.length === 3) return `rgb(${nums[0]}, ${nums[1]}, ${nums[2]})`;
  if (nums.length === 2) return `rgba(${nums[0]}, ${nums[0]}, ${nums[0]}, ${nums[1] / 255})`;
  return `rgb(${nums[0]}, ${nums[0]}, ${nums[0]})`;
}

type ShapePoint = { bezier: boolean; args: number[] };

export class Pen {
  private ctx: CanvasRenderingContext2D;
  private fillStyle: string | null = null;
  private strokeStyle: string | null = null;
  private weight = 1;
  private shapePoints: ShapePoint[] = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  fill(...args: RGBLike[]) {
    this.fillStyle = pcolor(...args);
  }

  noFill() {
    this.fillStyle = null;
  }

  stroke(...args: RGBLike[]) {
    this.strokeStyle = pcolor(...args);
  }

  noStroke() {
    this.strokeStyle = null;
  }

  strokeWeight(w: number) {
    this.weight = w;
  }

  private paint() {
    const { ctx } = this;
    if (this.fillStyle) {
      ctx.fillStyle = this.fillStyle;
      ctx.fill();
    }
    if (this.strokeStyle) {
      ctx.strokeStyle = this.strokeStyle;
      ctx.lineWidth = this.weight;
      ctx.stroke();
    }
  }

  ellipse(x: number, y: number, w: number, h: number) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
    this.paint();
  }

  rect(x: number, y: number, w: number, h: number) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    this.paint();
  }

  line(x1: number, y1: number, x2: number, y2: number) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    if (this.strokeStyle) {
      ctx.strokeStyle = this.strokeStyle;
      ctx.lineWidth = this.weight;
      ctx.stroke();
    }
  }

  quad(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    this.paint();
  }

  /** Processing arc(): angles here are degrees, closed pie-style (matches how the source fills its dome/shadow arcs). */
  arc(x: number, y: number, w: number, h: number, startDeg: number, stopDeg: number) {
    const { ctx } = this;
    const start = (startDeg * Math.PI) / 180;
    const stop = (stopDeg * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.ellipse(x, y, w / 2, h / 2, 0, start, stop);
    ctx.closePath();
    this.paint();
  }

  bezier(x1: number, y1: number, cx1: number, cy1: number, cx2: number, cy2: number, x2: number, y2: number) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
    if (this.strokeStyle) {
      ctx.strokeStyle = this.strokeStyle;
      ctx.lineWidth = this.weight;
      ctx.stroke();
    }
  }

  beginShape() {
    this.shapePoints = [];
  }

  vertex(x: number, y: number) {
    this.shapePoints.push({ bezier: false, args: [x, y] });
  }

  bezierVertex(cx1: number, cy1: number, cx2: number, cy2: number, x: number, y: number) {
    this.shapePoints.push({ bezier: true, args: [cx1, cy1, cx2, cy2, x, y] });
  }

  endShape(close?: boolean) {
    const { ctx } = this;
    ctx.beginPath();
    this.shapePoints.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.args[0], point.args[1]);
      } else if (point.bezier) {
        ctx.bezierCurveTo(point.args[0], point.args[1], point.args[2], point.args[3], point.args[4], point.args[5]);
      } else {
        ctx.lineTo(point.args[0], point.args[1]);
      }
    });
    if (close) ctx.closePath();
    this.paint();
  }

  pushMatrix() {
    this.ctx.save();
  }

  popMatrix() {
    this.ctx.restore();
  }

  translate(x: number, y: number) {
    this.ctx.translate(x, y);
  }

  /** Degrees, matching the source's `angle += speed / circumference * 360` bookkeeping. */
  rotate(deg: number) {
    this.ctx.rotate((deg * Math.PI) / 180);
  }
}

export const CLOSE = true;
