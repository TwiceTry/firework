"use strict";
// 创建 Canvas 元素
const contentNode = document.getElementById("app");
const canvas = document.createElement("canvas");
contentNode.appendChild(canvas);
// 设置 Canvas 的宽度和高度
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// 获取 Canvas 2D 上下文
const ctx = canvas.getContext("2d");
function distance(end, start) {
    return Math.hypot(end.x - start.x, end.y - start.y);
}
// 定义烟花类
class Firework {
    constructor(start, end, level = 3, parentHue, parentSpeed) {
        this.start = start;
        this.end = end;
        this.angle = {
            sin: (end.y - start.y) / Math.hypot(end.x - start.x, end.y - start.y),
            cos: (end.x - start.x) / Math.hypot(end.x - start.x, end.y - start.y),
        };
        this.totalDistance = distance(this.end, this.start);
        this.currentLocal = Object.assign({}, this.start);
        this.lastLocal = Object.assign({}, this.start);
        this.level = level;
        // px/s
        this.speed = (parentSpeed ? parentSpeed : 4) * 45 * this.level;
        // px/s*s
        this.acceleration = -0.75;
        this.brightness = random(60, 70);
        // /s
        this.decayRate = random(30, 60);
        this.targetRadius = 1;
        this.hue = parentHue ? parentHue : random(0, 360);
        this.log("新轨迹");
    }
    get finishedDistance() {
        return distance(this.currentLocal, this.start);
    }
    log(name) {
        // return;
        console.log(Object.assign({ name }, this));
    }
    // s
    update(deltaTime = 0.016) {
        this.lastLocal = Object.assign({}, this.currentLocal);
        // 移动烟花向目标点
        this.currentLocal.x =
            this.lastLocal.x + this.angle.cos * this.speed * deltaTime;
        this.currentLocal.y =
            this.lastLocal.y +
                this.angle.sin * this.speed * deltaTime -
                10 * deltaTime * deltaTime;
        this.speed *= 1 + this.acceleration * deltaTime;
        // 减小加速度并使烟花亮度降低
        // this.acceleration -= 0.0001;
        this.brightness -= this.decayRate * deltaTime;
        // 当烟花接近目标点且仍有亮度，创建爆炸效果
        if (this.finishedDistance >= this.totalDistance && this.brightness >= 0) {
            this.log("已到达");
            if (this.level > 1) {
                this.createFireworkExplosion();
            }
            fireworks.splice(fireworks.indexOf(this), 1);
        }
        else if (this.brightness <= 0 || this.speed <= 0) {
            this.log("未到达");
            fireworks.splice(fireworks.indexOf(this), 1);
        }
    }
    // 创建爆炸效果
    createFireworkExplosion() {
        const hue = random(0, 360);
        const radius = 40 * this.level;
        for (let r = 0; r < radius; r = r + 50 - this.level * 11) {
            const rNum = r / 10;
            for (let i = 0; i < rNum; ++i) {
                const explosRadius = (r * random(9900, 10900)) / 10000;
                const randomAngle = (random(0, 360) / 180) * Math.PI;
                const dx = explosRadius * Math.cos(randomAngle);
                const dy = explosRadius * Math.sin(randomAngle);
                const childFirework = new Firework(Object.assign({}, this.currentLocal), {
                    x: this.currentLocal.x + dx,
                    y: this.currentLocal.y + dy,
                }, this.level - 1, hue);
                fireworks.push(childFirework);
            }
        }
    }
    draw() {
        const drawCircle = function (start, radius, fillColor) {
            ctx.beginPath();
            ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
            if (typeof fillColor !== "undefined") {
                ctx.fillStyle = fillColor;
                ctx.fill();
            }
            ctx.stroke();
        };
        const drawLine = function (start, end, style, lineWidth = 1) {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            style && (ctx.strokeStyle = style);
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        };
        if (this.finishedDistance <= 5) {
            drawCircle(this.currentLocal, 2, `hsl(${this.hue}deg, 100%, ${this.brightness}%)`);
        }
        // 已走距离
        // drawLine(this.start, this.end, "rgba(255,255,255,0.1)", 20);
        // 总距离
        // drawLine(this.start, this.currentLocal, "rgba(0,0,255,0.1)", 10);
        drawLine(this.lastLocal, this.finishedDistance > this.totalDistance ? this.end : this.currentLocal, `hsl(${this.hue}deg, 100%, ${this.brightness}%)`, 1 + distance(this.lastLocal, this.start) / this.totalDistance);
        if (Math.abs(this.totalDistance - this.finishedDistance) <= 3) {
            drawCircle(this.currentLocal, this.level > 1 ? 2 : 1, `hsl(${this.hue}deg, 100%, ${this.brightness}%)`);
        }
    }
}
// 生成随机数
function random(min, max) {
    return Math.random() * (max - min) + min;
}
// 存储烟花对象的数组
const fireworks = [];
// 更新和绘制烟花
let lastTimestamp = 0;
function animate(timestamp) {
    const deltaTime = timestamp - lastTimestamp;
    if (deltaTime >= 16) {
        lastTimestamp = timestamp;
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        fireworks.forEach((firework) => {
            firework.update(deltaTime / 1000);
            firework.draw();
        });
    }
    requestAnimationFrame(animate);
}
// 监听鼠标点击事件，创建烟花
document.addEventListener("click", (event) => {
    const start = { x: event.clientX, y: event.clientY };
    const end = {
        x: (random(30, 70) / 100) * canvas.width,
        y: (random(20, 50) / 100) * canvas.height,
    };
    const firework = new Firework(start, end);
    fireworks.push(firework);
});
// 启动动画
requestAnimationFrame(animate);
fireworks.push(new Firework({ x: canvas.width * 0.5, y: canvas.height * 0.9 }, {
    x: canvas.width * 0.5,
    y: (canvas.height * random(25, 55)) / 100,
}));
function simulateMouseClick(element, clientX, clientY) {
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
