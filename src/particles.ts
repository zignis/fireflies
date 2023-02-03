import { createNoise3D, NoiseFunction3D } from "simplex-noise";

const TAU = 2 * Math.PI;
const particleCount = 1000;
const particlePropCount = 9;
const particlePropsLength = particleCount * particlePropCount;
const rangeY = 512;
const baseTTL = 256;
const rangeTTL = 256;
const baseSpeed = 0.1;
const rangeSpeed = 5;
const baseRadius = 2;
const rangeRadius = 2;
const baseHue = 60;
const rangeHue = 5;
const noiseSteps = 5;
const xOff = 0.00125;
const yOff = 0.00125;
const zOff = 0.0005;

const rand = (n: number) => n * Math.random();
const randRange = (n: number) => n - rand(2 * n);
const lerp = (n1: number, n2: number, speed: number) =>
  (1 - speed) * n1 + speed * n2;

const fadeInOut = (t: number, m: number) => {
  const hm = 0.5 * m;
  return Math.abs(((t + hm) % m) - hm) / hm;
};

type Theme = "dark" | "light";

export default class Particles {
  private ctx: {
    main: CanvasRenderingContext2D;
    pseudo: CanvasRenderingContext2D;
  };

  private tick: number;

  private readonly theme: Theme;
  private readonly mainCanvas: HTMLCanvasElement;
  private readonly pseudoCanvas: HTMLCanvasElement;
  private readonly center: number[];
  private readonly noise: NoiseFunction3D;
  private readonly particleProps: Float32Array;

  constructor(canvas: HTMLCanvasElement, theme: Theme) {
    this.tick = 0;
    this.theme = theme;
    this.noise = createNoise3D();
    this.particleProps = new Float32Array(particlePropsLength);
    this.pseudoCanvas = document.createElement("canvas");
    this.mainCanvas = canvas;

    this.ctx = {
      main: this.mainCanvas.getContext("2d")!,
      pseudo: this.pseudoCanvas.getContext("2d")!,
    };

    this.center = [];

    this.resize();
    this.initParticles();
    this.draw();

    window.addEventListener("resize", this.resize.bind(this));
  }

  private initParticles(): void {
    for (let i = 0; i < particlePropsLength; i += particlePropCount) {
      this.initParticle(i);
    }
  }

  private initParticle(i: number): void {
    const x = rand(this.pseudoCanvas.width);
    const y = this.center[1] + randRange(rangeY);
    const vx = 0;
    const vy = 0;
    const life = 0;
    const ttl = baseTTL + rand(rangeTTL);
    const speed = baseSpeed + rand(rangeSpeed);
    const radius = baseRadius + rand(rangeRadius);
    const hue = baseHue + rand(rangeHue);

    this.particleProps.set([x, y, vx, vy, life, ttl, speed, radius, hue], i);
  }

  private drawParticles(): void {
    for (let i = 0; i < particlePropsLength; i += particlePropCount) {
      this.updateParticle(i);
    }
  }

  private updateParticle(i: number): void {
    const i2 = 1 + i;
    const i3 = 2 + i;
    const i4 = 3 + i;
    const i5 = 4 + i;
    const i6 = 5 + i;
    const i7 = 6 + i;
    const i8 = 7 + i;
    const i9 = 8 + i;

    const x = this.particleProps[i];
    const y = this.particleProps[i2];
    const n =
      this.noise(x * xOff, y * yOff, this.tick * zOff) * noiseSteps * TAU;
    const vx = lerp(this.particleProps[i3], Math.cos(n), 0.5);
    const vy = lerp(this.particleProps[i4], Math.sin(n), 0.5);
    let life = this.particleProps[i5];
    const ttl = this.particleProps[i6];
    const speed = this.particleProps[i7];
    const x2 = x + vx * speed;
    const y2 = y + vy * speed;
    const radius = this.particleProps[i8];
    const hue = this.particleProps[i9];

    this.drawParticle(x, y, x2, y2, life, ttl, radius, hue);

    life++;

    this.particleProps[i] = x2;
    this.particleProps[i2] = y2;
    this.particleProps[i3] = vx;
    this.particleProps[i4] = vy;
    this.particleProps[i5] = life;

    (this.checkBounds(x, y) || life > ttl) && this.initParticle(i);
  }

  private drawParticle(
    x: number,
    y: number,
    x2: number,
    y2: number,
    life: number,
    ttl: number,
    radius: number,
    hue: number
  ): void {
    this.ctx.pseudo.save();
    this.ctx.pseudo.lineCap = "round";
    this.ctx.pseudo.lineWidth = radius;
    this.ctx.pseudo.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(
      life,
      ttl
    )})`;

    this.ctx.pseudo.beginPath();
    this.ctx.pseudo.moveTo(x, y);
    this.ctx.pseudo.lineTo(x2, y2);
    this.ctx.pseudo.stroke();
    this.ctx.pseudo.closePath();
    this.ctx.pseudo.restore();
  }

  private checkBounds(x: number, y: number): boolean {
    return (
      x > this.pseudoCanvas.width ||
      x < 0 ||
      y > this.pseudoCanvas.height ||
      y < 0
    );
  }

  private renderGlow(): void {
    this.ctx.main.save();
    this.ctx.main.filter = `blur(8px) brightness(${
      this.theme === "light" ? 100 : 200
    }%)`;

    this.ctx.main.globalCompositeOperation =
      this.theme === "light" ? "darken" : "lighten";
    this.ctx.main.drawImage(this.pseudoCanvas, 0, 0);
    this.ctx.main.restore();

    this.ctx.main.save();
    this.ctx.main.filter = `blur(4px) brightness(${
      this.theme === "light" ? 100 : 200
    }%)`;

    this.ctx.main.globalCompositeOperation =
      this.theme === "light" ? "darken" : "lighten";
    this.ctx.main.drawImage(this.pseudoCanvas, 0, 0);
    this.ctx.main.restore();
  }

  private renderToScreen(): void {
    this.ctx.main.save();
    this.ctx.main.globalCompositeOperation =
      this.theme === "light" ? "darken" : "lighten";

    this.ctx.main.drawImage(this.pseudoCanvas, 0, 0);
    this.ctx.main.restore();
  }

  private draw(): void {
    this.tick++;

    this.ctx.pseudo.clearRect(
      0,
      0,
      this.pseudoCanvas.width,
      this.pseudoCanvas.height
    );

    this.ctx.main.fillStyle = this.theme === "light" ? "#fff" : "#000";
    this.ctx.main.fillRect(
      0,
      0,
      this.pseudoCanvas.width,
      this.pseudoCanvas.height
    );

    this.drawParticles();
    this.renderGlow();
    this.renderToScreen();

    window.requestAnimationFrame(this.draw.bind(this));
  }

  private resize(): void {
    const { innerWidth, innerHeight } = window;

    this.pseudoCanvas.width = innerWidth;
    this.pseudoCanvas.height = innerHeight;

    this.ctx.pseudo.drawImage(this.mainCanvas, 0, 0);

    this.mainCanvas.width = innerWidth;
    this.mainCanvas.height = innerHeight;

    this.ctx.main.drawImage(this.pseudoCanvas, 0, 0);

    this.center[0] = 0.5 * this.pseudoCanvas.width;
    this.center[1] = 0.5 * this.pseudoCanvas.height;
  }

  public destroy(): void {
    window.removeEventListener("resize", this.resize.bind(this));
  }
}
