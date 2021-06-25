const DRAW_GRID = 0;
const SCORE_MARGIN = 40;

const BLOCK_WIDTH = 20;
const BLOCK_HEIGHT = 20;

const GRID_SIZE_X = Math.min(41, Math.floor(window.innerWidth / BLOCK_WIDTH));
const GRID_SIZE_Y = Math.min(41, Math.floor((window.innerHeight - SCORE_MARGIN) / BLOCK_HEIGHT));
const INIT_SNAKE_LEN = Math.max(5, Math.floor((GRID_SIZE_X * GRID_SIZE_Y) * 0.005));

const MARGIN = 5;

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas');
canvas.width = GRID_SIZE_X * BLOCK_WIDTH;
canvas.height = GRID_SIZE_Y * BLOCK_HEIGHT + SCORE_MARGIN;
document.body.style.paddingLeft = `${Math.floor((window.innerWidth - canvas.width) / 2)}px`;
document.body.style.paddingTop = `${Math.floor((window.innerHeight - canvas.height) / 2)}px`;

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');

let snake;
let food;
let score;
let speed;
let gameOver;
let elapsed;
let prevTime;
let dir;
let snakeLen;
let requestedDir;
let lastTouch;
let eaten;
function init() {
    let startX = Math.floor((GRID_SIZE_X - INIT_SNAKE_LEN) / 2);
    let startY = Math.floor(GRID_SIZE_Y / 2);
    snake = [];

    for (let i = 0; i < INIT_SNAKE_LEN; i++) {
        snake.push({ x: startX + i, y: startY });
    }

    spawnFood();
    score = 0;
    eaten = 0;
    speed = 75;
    gameOver = false;
    elapsed = 0;
    dir = 'right';
    snakeLen = INIT_SNAKE_LEN;
    requestedDir = '';
    lastTouch = null;
    updateScore();
    updateGameoOver();
}

function spawnFood() {
    let isUnsafe;
    do {
        food = {
            x: getRandomInt(0, GRID_SIZE_X),
            y: getRandomInt(0, GRID_SIZE_Y),
        };

        isUnsafe = snake.some((sp) => isColliding(sp, food));
    } while (isUnsafe);
}

function update(delta) {
    if (isGameOver()) {
        return;
    }
    elapsed += delta;
    if (elapsed >= speed) {
        elapsed -= speed;
        if (requestedDir) {
            if ((dir == 'left' && requestedDir != 'right') ||
                (dir == 'right' && requestedDir != 'left') ||
                (dir == 'up' && requestedDir != 'down') ||
                (dir == 'down' && requestedDir != 'up')) {
                dir = requestedDir;
            }
            requestedDir = '';
        } else if (lastTouch) {
            if (dir == 'left' || dir == 'right') {
                if (lastTouch.pageY <= (window.innerHeight / 2)) {
                    dir = 'up';
                } else {
                    dir = 'down'
                }
            } else if (dir == 'up' || dir == 'down') {
                if (lastTouch.pageX <= (window.innerWidth / 2)) {
                    dir = 'left';
                } else {
                    dir = 'right'
                }
            }
            lastTouch = null;
        }
        const head = snake[snake.length - 1];
        const newHead = {};
        switch (dir) {
            case 'up':
                newHead.x = head.x;
                newHead.y = head.y - 1;
                if (newHead.y < 0) {
                    newHead.y = GRID_SIZE_Y - 1;
                }
                break;
            case 'down':
                newHead.x = head.x;
                newHead.y = head.y + 1;
                if (newHead.y > GRID_SIZE_Y - 1) {
                    newHead.y = 0;
                }
                break;
            case 'left':
                newHead.x = head.x - 1;
                newHead.y = head.y;
                if (newHead.x < 0) {
                    newHead.x = GRID_SIZE_X - 1;
                }
                break;
            case 'right':
                newHead.x = head.x + 1;
                newHead.y = head.y;
                if (newHead.x > GRID_SIZE_X - 1) {
                    newHead.x = 0;
                }
                break;
        }
        snake.forEach((sp) => {
            if (isColliding(newHead, sp)) {
                gameOver = true;
                updateGameoOver();
            }
        });
        if (isColliding(newHead, food)) {
            score += getScoreIncrement();
            eaten ++;
            snakeLen++;
            spawnFood();
            updateScore();
        }
        snake.push(newHead);
        while (snake.length > snakeLen) {
            snake.shift();
        }
    }
}

function getScoreIncrement() {
    /**
     * Cubic regression curve fitting (https://mycurvefit.com/)
     *  1                  1        
     *  5                  3        
     * 10                  8        
     * 15                 14        
     * 20                 21        
     * 25                 30        
     */
    return Math.max(1, Math.min(50, Math.floor(0.4441263 + 0.3989887 * eaten + 0.03551711 * eaten * eaten - 0.000172774 * eaten * eaten * eaten)));
}

function render() {

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    fillBackground();

    drawGrid();

    drawScore();

    drawSnake();
    drawFood();
    if (isGameOver())
        drawGameOver();
}

function withSavedContext(cb) {
    ctx.save();
    try {
        return cb();
    } finally {
        ctx.restore();
    }
}

function fillBackground() {
    withSavedContext(function () {
        ctx.fillStyle = 'rgb(253 252 219 / 43%)';
        ctx.fillRect(0, SCORE_MARGIN, canvas.width, canvas.height);
    });
}

function drawFood() {
    withSavedContext(function () {
        ctx.beginPath();
        ctx.fillStyle = '#cc6b7e';
        ctx.arc((food.x * BLOCK_WIDTH) + (BLOCK_WIDTH / 2), SCORE_MARGIN + (food.y * BLOCK_HEIGHT) + (BLOCK_HEIGHT / 2), (BLOCK_WIDTH - MARGIN) / 2, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function drawSnake() {
    withSavedContext(function () {
        for (let i = 0; i < snake.length; i++) {
            let t = i / (snake.length - 1);
            let alpha = (1 - t) * 0.5 + t * 1;
            let extraMargin = (1 - t) * (BLOCK_WIDTH / 4) + t * 0;
            ctx.fillStyle = `rgb(132,220,207,${alpha})`;
            ctx.fillRect((snake[i].x * BLOCK_WIDTH) + (MARGIN / 2) + (extraMargin / 2), (snake[i].y * BLOCK_HEIGHT) + (MARGIN / 2) + (extraMargin / 2) + SCORE_MARGIN, BLOCK_WIDTH - MARGIN - extraMargin, BLOCK_HEIGHT - MARGIN - extraMargin);
        }
    });
}

function drawScore() {
    withSavedContext(function () {
        const scoreText = `Score: ${score}`;
        ctx.fillStyle = '#95ac9d';
        ctx.fillRect(0, 0, canvas.width, SCORE_MARGIN);
        ctx.fillStyle = 'white';
        ctx.font = '24px serif';
        const measurements = ctx.measureText(scoreText);
        ctx.fillText(scoreText, canvas.width - measurements.width, 10 + Math.abs(measurements.actualBoundingBoxAscent));
    });
}

function drawGrid() {
    if (!DRAW_GRID) return;
    withSavedContext(function () {
        ctx.strokeStyle = 'rgb(0,0,0,0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_SIZE_X; i++) {
            ctx.beginPath();
            ctx.moveTo(i * BLOCK_WIDTH, SCORE_MARGIN);
            ctx.lineTo(i * BLOCK_WIDTH, canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i <= GRID_SIZE_Y; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * BLOCK_HEIGHT + SCORE_MARGIN);
            ctx.lineTo(canvas.width, i * BLOCK_HEIGHT + SCORE_MARGIN);
            ctx.stroke();
        }
    });
}

function drawGameOver() {
    withSavedContext(function () {
        ctx.fillStyle = 'rgb(255, 255, 255, 0.7)';
        ctx.fillRect(0, SCORE_MARGIN, canvas.width, canvas.height - SCORE_MARGIN);
        ctx.fillStyle = '#BF98A0';
        ctx.font = '24px Sarif';
        const text = 'Game over! Press any key to restart..';
        const measurements = ctx.measureText(text);
        ctx.fillText(text, (canvas.width - measurements.width) / 2, (canvas.height - SCORE_MARGIN) / 2 + Math.abs(measurements.actualBoundingBoxAscent));
    });
}

function isColliding(p1, p2) {
    return p1.x == p2.x && p1.y == p2.y;
}

function isGameOver() {
    return gameOver;
}

prevTime = performance.now();
init();
render();


function frameCallback() {
    const curTime = performance.now();
    const delta = curTime - prevTime;
    prevTime = curTime;
    update(delta);
    render();
    window.requestAnimationFrame(frameCallback);
}
window.requestAnimationFrame(frameCallback);

document.addEventListener('keydown', function (e) {
    if (isGameOver()) {
        init();
        return;
    }
    switch (e.key) {
        case "ArrowLeft":
            requestedDir = 'left';
            lastTouch = null;
            break;
        case "ArrowRight":
            requestedDir = 'right';
            lastTouch = null;
            break;
        case "ArrowUp":
            requestedDir = 'up';
            lastTouch = null;
            break;
        case "ArrowDown":
            requestedDir = 'down';
            lastTouch = null;
            break;
    }
})

document.addEventListener('touchend', function (e) {
    if (isGameOver()) {
        init();
        return;
    }
    requestedDir = null;
    lastTouch = copyTouch(e.changedTouches[0]);
});

function copyTouch({ identifier, pageX, pageY }) {
    return { identifier, pageX, pageY };
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function updateScore() { }

function updateGameoOver() { }