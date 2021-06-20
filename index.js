const GRID_SIZE = 21;
const INIT_SNAKE_LEN = 5;

const BLOCK_WIDTH = 20;
const BLOCK_HEIGHT = 20;

const MARGIN = 5;

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas');
canvas.width = GRID_SIZE * BLOCK_WIDTH;
canvas.height = GRID_SIZE * BLOCK_HEIGHT;

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');

let snake;
let food;
let score;
let scoreMultiplier;
let speed; 
let gameOver;
let elapsed;
let prevTime;
let dir;
let snakeLen;
let requestedDir;
function init() {
    let startX = (GRID_SIZE - INIT_SNAKE_LEN) / 2;
    let startY = Math.floor(GRID_SIZE/2);
    snake = [];
    
    for(let i = 0; i < INIT_SNAKE_LEN;i++) {
        snake.push({x: startX + i, y: startY});
    }
    console.log(snake);

    
    spawnFood();
    console.log(food);
    score = 0;
    scoreMultiplier = 10;
    speed = 75; 
    gameOver = false;
    elapsed = 0;
    dir = 'right';
    snakeLen = INIT_SNAKE_LEN;
    requestedDir = '';
    updateScore();
    updateGameoOver();
}

function spawnFood() {
    let isUnsafe;
    do {
        food = {
            x: getRandomInt(0, GRID_SIZE),
            y: getRandomInt(0, GRID_SIZE),
        };

        isUnsafe = snake.some((sp) => isColliding(sp, food));
    } while(isUnsafe);
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
        }
        const head = snake[snake.length-1];
        const newHead = {};
        switch(dir) {
            case 'up':
                newHead.x = head.x;
                newHead.y = head.y - 1;
                if (newHead.y < 0) {
                    newHead.y = GRID_SIZE - 1;
                }
                break;
            case 'down':
                newHead.x = head.x;
                newHead.y = head.y + 1;
                if (newHead.y > GRID_SIZE-1) {
                    newHead.y = 0;
                }
                break;
            case 'left':
                newHead.x = head.x - 1;
                newHead.y = head.y;
                if (newHead.x < 0) {
                    newHead.x = GRID_SIZE - 1;
                }
                break;
            case 'right':
                newHead.x = head.x + 1;
                newHead.y = head.y;
                if (newHead.x > GRID_SIZE-1) {
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
            score += scoreMultiplier;
            snakeLen++;
            spawnFood();
            updateScore();
        }
        snake.push(newHead);
        while (snake.length > snakeLen) {
            snake.shift();
        }
    }
    // todo: update the state
}

function render() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgb(253 252 219 / 43%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for(let i = 0; i < snake.length; i++) {
        let t = i/(snake.length-1);
        let alpha = (1 - t) * 0.5 + t * 1;
        let extraMargin = (1 - t) * (BLOCK_WIDTH/4) + t * 0;
        console.log(i, extraMargin);
        ctx.fillStyle = `rgb(127,222,127,${alpha})`;
        ctx.fillRect((snake[i].x * BLOCK_WIDTH) + (MARGIN/2) + (extraMargin/2), (snake[i].y * BLOCK_HEIGHT) + (MARGIN/2) + (extraMargin/2), BLOCK_WIDTH - MARGIN - extraMargin, BLOCK_HEIGHT - MARGIN - extraMargin);
    }
    ctx.fillStyle = '#d62020';
    ctx.fillRect((food.x * BLOCK_WIDTH) + MARGIN, (food.y * BLOCK_HEIGHT) + MARGIN, BLOCK_WIDTH - MARGIN, BLOCK_HEIGHT - MARGIN);
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

document.addEventListener('keydown', function(e) {
    switch(e.key){
        case "ArrowLeft":
            requestedDir = 'left';
            break;
        case "ArrowRight":
            requestedDir = 'right';
            break;
        case "ArrowUp":
            requestedDir = 'up';
            break;
        case "ArrowDown":
            requestedDir = 'down';
            break;
        case 'Enter':
            if (isGameOver()) {
                init();
            }
    }

})

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function updateScore() {
    document.getElementById('score').innerHTML = score;
}
function updateGameoOver() {
    document.getElementById('gameover').style.display = isGameOver() ? 'block' : 'none';
}