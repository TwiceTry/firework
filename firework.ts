// 创建 Canvas 元素
const contentNode = document.getElementById("app")!;
const canvas = document.createElement("canvas");
contentNode.appendChild(canvas);

// 设置 Canvas 的宽度和高度
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 获取 Canvas 2D 上下文
const ctx = canvas.getContext("2d")!;
interface Coordinate {
  x: number;
  y: number;
}
function distance(end: Coordinate, start: Coordinate): number {
  return Math.hypot(end.x - start.x, end.y - start.y);
}
// 定义烟花类
class Firework {
  start: Coordinate;
  end: Coordinate;
  angle: { sin: number; cos: number };
  level: number;
  currentLocal: Coordinate;
  lastLocal: Coordinate;
  speed: number;
  acceleration: number;
  brightness: number;
  targetRadius: number;
  hue: number;

  constructor(
    start: Coordinate,
    end: Coordinate,

    level: number = 3,
    parentHue?: number,
    parentSpeed?: number
  ) {
    this.start = start;
    this.end = end;
    this.angle = {
      sin: (end.y - start.y) / Math.hypot(end.x - start.x, end.y - start.y),
      cos: (end.x - start.x) / Math.hypot(end.x - start.x, end.y - start.y),
    };

    this.currentLocal = { ...this.start };
    this.lastLocal = { ...this.start };
    this.level = level;
    // px/s
    this.speed = parentSpeed ? parentSpeed : (1 + 3 * this.level) / 60;
    this.acceleration = 1.25;

    this.brightness = random(60, 70);
    this.targetRadius = 1;
    this.hue = parentHue ? parentHue : random(0, 360);
    this.log("新轨迹");
  }
  log(name: string) {
    return;
    console.log({
      name,
      ...this,
    });
  }
  update() {
    this.lastLocal = { ...this.currentLocal };
    // 移动烟花向目标点
    this.currentLocal.x = this.lastLocal.x + this.angle.cos * this.speed;
    this.currentLocal.y = this.lastLocal.y + this.angle.sin * this.speed;

    this.speed *= this.acceleration;
    // 减小加速度并使烟花亮度降低
    this.acceleration -= 0.003;
    this.brightness -= 0.05;

    // 当烟花接近目标点且仍有亮度，创建爆炸效果
    if (
      distance(this.currentLocal, this.start) >
        distance(this.end, this.start) &&
      this.brightness >= 0
    ) {
      this.log("已到达");
      if (this.level > 1) {
        this.createFireworkExplosion();
      }

      fireworks.splice(fireworks.indexOf(this), 1);
    } else if (this.brightness <= 0 || this.speed <= 0) {
      this.log("未到达");
      fireworks.splice(fireworks.indexOf(this), 1);
    }
  }
  // 创建爆炸效果
  createFireworkExplosion() {
    const hue = random(0, 360);
    const radius = 40 * this.level;
    // const childFireworkNum = 50 - 5 * this.level;
    for (let r = 0; r < radius; r = r + 50 - this.level * 11) {
      const rNum = r / 10;
      for (let i = 0; i < rNum; ++i) {
        const explosRadius = (r * random(9900, 10900)) / 10000;
        const randomAngle = (random(0, 360) / 180) * Math.PI;
        const dx = explosRadius * Math.cos(randomAngle);
        const dy = explosRadius * Math.sin(randomAngle);
        const childFirework = new Firework(
          { ...this.currentLocal },
          {
            x: this.currentLocal.x + dx,
            y: this.currentLocal.y + dy,
          },

          this.level - 1,
          hue
        );
        fireworks.push(childFirework);
      }
    }
  }
  draw() {
    const drawCircle = function (
      start: Coordinate,
      radius: number,
      fillColor?: string
    ) {
      ctx.beginPath();
      ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
      if (typeof fillColor !== "undefined") {
        ctx.fillStyle = fillColor;
        ctx.fill();
      }
      ctx.stroke();
    };
    const drawLine = function (
      start: Coordinate,
      end: Coordinate,
      style: string,
      lineWidth: number = 1
    ) {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);

      style && (ctx.strokeStyle = style);
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };
    if (distance(this.currentLocal, this.start) <= 5) {
      drawCircle(
        this.currentLocal,
        2,
        `hsl(${this.hue}deg, 100%, ${this.brightness}%)`
      );
    }
    // drawLine(this.start, this.end, "rgba(255,255,255,0.1)", 20);
    drawLine(
      this.lastLocal,
      this.currentLocal,
      `hsl(${this.hue}deg, 100%, ${this.brightness}%)`,
      1 +
        ((distance(this.currentLocal, this.start) /
          distance(this.end, this.start)) *
          distance(this.currentLocal, this.start)) /
          distance(this.end, this.start)
    );

    if (distance(this.end, this.currentLocal) <= 5) {
      drawCircle(
        this.currentLocal,
        2,
        `hsl(${this.hue}deg, 100%, ${this.brightness}%)`
      );
    }
  }
}

// 生成随机数
function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// 存储烟花对象的数组
const fireworks: Firework[] = [];

// 更新和绘制烟花
let lastTimestamp = 0;
function animate(timestamp: number) {
  const deltaTime = timestamp - lastTimestamp;

  if (deltaTime >= 16) {
    lastTimestamp = timestamp;
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    fireworks.forEach((firework) => {
      firework.update();
      firework.draw();
    });
  }
  requestAnimationFrame(animate);
}

// 监听鼠标点击事件，创建烟花
document.addEventListener("click", (event) => {
  const start: Coordinate = { x: event.clientX, y: event.clientY };
  const end: Coordinate = {
    x: (random(30, 70) / 100) * canvas.width,
    y: (random(20, 50) / 100) * canvas.height,
  };

  const firework = new Firework(start, end);
  fireworks.push(firework);
});

// 启动动画
requestAnimationFrame(animate);

fireworks.push(
  new Firework(
    { x: canvas.width * 0.5, y: canvas.height * 0.9 },
    {
      x: canvas.width * 0.5,
      y: (canvas.height * random(25, 55)) / 100,
    }
  )
);

function simulateMouseClick(
  element: HTMLElement,
  clientX: number,
  clientY: number
) {
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
  });

  element.dispatchEvent(event);
}

// 模拟点击事件
simulateMouseClick(canvas, canvas.width * 0.5, canvas.height * 0.8);
