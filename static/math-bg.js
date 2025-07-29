let particles = [];
let angleOffset = 0;
let waveOffset = 0;
let floatingEquations = [];
let rockets = [];

let isMobile = /Mobi|Android/i.test(navigator.userAgent);
let lastActive = Date.now();

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.position(0, 0);
    canvas.style('z-index', '-1');
    canvas.style('position', 'fixed');

    if (isMobile) {
        frameRate(30);
        reduceGraphicsForMobile();
    } else {
        for (let i = 0; i < 40; i++) spawnNewEquation();
        for (let i = 0; i < 100; i++) {
            particles.push({
                angle: random(TWO_PI),
                radius: random(30, 80),
                speed: random(0.01, 0.03)
            });
        }
    }
}

function draw() {
    if (isMobile && Date.now() - lastActive > 20000) return; // ⏸️ pause on idle (20s)

    background(15, 15, 25, 100);

    drawGrid();
    drawFloatingEquations();
    drawWaves();
    drawOrbitingParticles();

    if (!isMobile) drawMouseSparkles();
    drawRockets();

    if (frameCount % 200 === 0) {
        launchRocket();
    }
}

function reduceGraphicsForMobile() {
    floatingEquations = [];
    rockets = [];

    for (let i = 0; i < 20; i++) spawnNewEquation();
    for (let i = 0; i < 40; i++) {
        particles.push({
            angle: random(TWO_PI),
            radius: random(20, 60),
            speed: random(0.01, 0.025)
        });
    }
}

function drawGrid() {
    stroke(80, 255, 200, 60);
    strokeWeight(1);
    for (let x = 0; x < width; x += 40) line(x, 0, x, height);
    for (let y = 0; y < height; y += 40) line(0, y, width, y);
}

function drawFloatingEquations() {
    for (let i = floatingEquations.length - 1; i >= 0; i--) {
        const eq = floatingEquations[i];

        fill(255, eq.alpha);
        noStroke();
        textSize(eq.size);
        text(eq.text, eq.x, eq.y);

        eq.x += eq.speedX;
        eq.y += eq.speedY;
        eq.ttl--;

        if (eq.ttl < 60) eq.alpha -= 4;

        if (eq.alpha <= 0 || eq.ttl <= 0) {
            floatingEquations.splice(i, 1);
            spawnNewEquation();
        }
    }
}

function spawnNewEquation() {
    const eqTexts = [
        "E = mc²", "∫x dx", "sin(θ)", "f(x) = x²", "π ≈ 3.14",
        "cos(2x)", "x = (-b ± √Δ)/2a", "Σn=1^∞", "∂²ψ/∂x²",
        "lim x→0", "∆V = IR", "θ = ωt", "y = mx + c",
        "V = 4/3πr³", "A = πr²", "F = ma", "tan(x)", 
        "∫e^x dx", "a² + b² = c²", "∇ • E = ρ/ε₀",
        "λ = h/p", "∂u/∂t = α∇²u", "ΔS ≥ 0", "Q = mcΔT"
    ];

    floatingEquations.push({
        x: random(width),
        y: random(height),
        speedX: random(-0.3, 0.3),
        speedY: random(-0.2, 0.2),
        text: random(eqTexts),
        size: random(14, 24),
        alpha: 255,
        ttl: random(300, 800)
    });
}

function drawWaves() {
    noFill();
    stroke(255, 100, 200, 80);
    beginShape();
    for (let x = 0; x < width; x++) {
        let y = 150 + 40 * sin(0.02 * x + waveOffset);
        vertex(x, y);
    }
    endShape();

    stroke(100, 200, 255, 80);
    beginShape();
    for (let x = 0; x < width; x++) {
        let y = 200 + 40 * cos(0.025 * x + waveOffset);
        vertex(x, y);
    }
    endShape();

    waveOffset += 0.05;
}

function drawOrbitingParticles() {
    let cx = width / 2;
    let cy = height / 2;

    fill(255, 255, 255, 180);
    textSize(24);
    text("π", cx - 8, cy);

    fill(255, 100, 200, 120);
    noStroke();

    particles.forEach(p => {
        p.angle += p.speed;
        let x = cx + cos(p.angle + angleOffset) * p.radius;
        let y = cy + sin(p.angle + angleOffset) * p.radius;
        ellipse(x, y, 4, 4);
    });

    angleOffset += 0.01;
}

function drawMouseSparkles() {
    stroke(255, 255, 255, 100);
    strokeWeight(2);
    for (let i = 0; i < 8; i++) {
        let angle = TWO_PI * i / 8 + frameCount * 0.05;
        let x = mouseX + cos(angle) * 10;
        let y = mouseY + sin(angle) * 10;
        point(x, y);
    }
}

function launchRocket() {
    rockets.push({
        x: random(width),
        y: height + 10,
        speedY: random(-3, -6),
        trail: []
    });
}

function drawRockets() {
    for (let i = rockets.length - 1; i >= 0; i--) {
        let r = rockets[i];

        r.y += r.speedY;
        r.trail.push({ x: r.x, y: r.y + 20 });

        stroke(255, 0, 0);
        strokeWeight(4);
        line(r.x, r.y, r.x, r.y + 20);

        noStroke();
        fill(255, 200, 0);
        ellipse(r.x, r.y + 20, 8, 8);

        for (let t = 0; t < r.trail.length; t++) {
            let pt = r.trail[t];
            fill(255, 200, 0, 150 - t * 10);
            point(pt.x, pt.y); // 🔁 Lighter than ellipse()
        }

        if (r.y < -20) rockets.splice(i, 1);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

document.addEventListener("touchstart", () => {
    lastActive = Date.now(); // 🔄 wake up after idle
});
