const COLS = 24;
const ROWS = 24;
const GAME_SPEED = 180;
const FOOD_SCORE = 10;
const TARGET_SCORE = 100;


const gameArea = document.getElementById("game-area");
const scoreElement = document.getElementById("score");
const boardScoreElement = document.getElementById("board-score");
const highScoreElement = document.getElementById("high-score");
const levelElement = document.getElementById("level");
const targetElement = document.getElementById("target");
const gameStatusElement = document.getElementById("game-status");
const pauseButton = document.getElementById("pause-button");
const restartButton = document.getElementById("restart-button");
const settingButton = document.getElementById("setting");


const gameOverModalElement = document.getElementById("gameOverModal");
const levelCompleteModalElement = document.getElementById("levelCompleteModal");
const gameOverModal = new bootstrap.Modal(gameOverModalElement);
const levelCompleteModal = new bootstrap.Modal(levelCompleteModalElement);

// Game state
let snake = [];
let food = {x: 10, y: 10};

let direction = "RIGHT";
let nextDirection = "RIGHT";

let score = 0;
let gameRunning = false;
let gamePaused = false;
let gameLoop = null;

// Random vị trí rắn xuất hiện
function generateRandomSnake() {
    const directions = ["UP", "DOWN", "LEFT", "RIGHT"];
    const randomDir = directions[Math.floor(Math.random() * directions.length)];
    direction = randomDir;
    nextDirection = randomDir;

    const margin = 4;
    const headX = Math.floor(Math.random() * (COLS - margin * 2)) + margin;
    const headY = Math.floor(Math.random() * (ROWS - margin * 2)) + margin;

    const newSnake = [{ x: headX, y: headY }];
    const SNAKE_INITIAL_LENGTH = 3;


    for (let i = 1; i < SNAKE_INITIAL_LENGTH; i++) {
        let segmentX = headX;
        let segmentY = headY;

        switch (direction) {
            case "RIGHT": segmentX = headX - i; break;
            case "LEFT":  segmentX = headX + i; break;
            case "UP":    segmentY = headY + i; break;
            case "DOWN":  segmentY = headY - i; break;
        }

        newSnake.push({ x: segmentX, y: segmentY });
    }
    return newSnake;
}


// Start game
function startGame() {

    if (gameLoop !== null) {
        clearInterval(gameLoop);
        gameLoop = null;
    }

    snake = generateRandomSnake();
    createFood();
    score = 0;
    gameRunning = true;
    gamePaused = false;

    levelElement.textContent = "1";
    targetElement.textContent = TARGET_SCORE;
    gameStatusElement.textContent = "PLAYING";
    pauseButton.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
    gameArea.innerHTML = "";
    renderSnake();
    renderFood();
    updateUI();

    gameLoop = setInterval(
        updateGame,
        GAME_SPEED
    );
}

function updateGame() {

    if (!gameRunning || gamePaused) {
        return;
    }

    direction = nextDirection;

    // Tạo đầu mới
    const head = {
        x: snake[0].x,
        y: snake[0].y
    };

    // Di chuyển
    switch (direction) {

        case "UP":
            head.y--;
            break;

        case "DOWN":
            head.y++;
            break;

        case "LEFT":
            head.x--;
            break;

        case "RIGHT":
            head.x++;
            break;
    }

    // Kiểm tra chạm tường
    if (
        head.x < 0 ||
        head.x >= COLS ||
        head.y < 0 ||
        head.y >= ROWS
    ) {
        gameOver();
        return;
    }

    const ateFood = head.x === food.x && head.y === food.y;

    const bodyToCheck = ateFood ? snake : snake.slice(0, -1);

    const hitSelf = bodyToCheck.some(segment => segment.x === head.x && segment.y === head.y);

    if (hitSelf) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // Ăn mồi
    if (ateFood) {
        score += FOOD_SCORE;

        if (score >= TARGET_SCORE) {
            updateUI();
            renderSnake();
            levelComplete();
            return;
        }

        createFood();

    } else {
        snake.pop();
    }

    renderSnake();
    renderFood();
    updateUI();
}

function createFood() {
    let newFood;
    let positionIsValid = false;

    while (!positionIsValid) {

        newFood = {x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS)

        };

        positionIsValid = !snake.some(
            segment =>
                segment.x === newFood.x &&
                segment.y === newFood.y
        );
    }

    food = newFood;
}

function renderSnake() {

    const oldSnake = gameArea.querySelectorAll(".snake-part, .snake-head");

    oldSnake.forEach(element => element.remove());

    snake.forEach(
        (segment, index) => {
            const snakeElement = document.createElement("div");

            if (index === 0) {
                snakeElement.classList.add("snake-head");
                createEyes(snakeElement);

            } else {

                snakeElement.classList.add("snake-part");
            }

            snakeElement.style.left = `${(segment.x / COLS) * 100}%`;
            snakeElement.style.top = `${(segment.y / ROWS) * 100}%`;

            gameArea.appendChild(snakeElement);
        }
    );
}


function createEyes(headElement) {

    const eye1 = document.createElement("span");
    const eye2 = document.createElement("span");

    eye1.classList.add("snake-eye");
    eye2.classList.add("snake-eye");

    switch (direction) {

        case "UP":

            eye1.style.top = "5px";
            eye1.style.left = "5px";

            eye2.style.top = "5px";
            eye2.style.right = "5px";

            break;


        case "DOWN":

            eye1.style.bottom = "5px";
            eye1.style.left = "5px";

            eye2.style.bottom = "5px";
            eye2.style.right = "5px";

            break;


        case "LEFT":

            eye1.style.left = "5px";
            eye1.style.top = "5px";

            eye2.style.left = "5px";
            eye2.style.bottom = "5px";

            break;


        case "RIGHT":

            eye1.style.right = "5px";
            eye1.style.top = "5px";

            eye2.style.right = "5px";
            eye2.style.bottom = "5px";

            break;
    }

    headElement.appendChild(eye1);
    headElement.appendChild(eye2);
}


function renderFood() {

    const oldFood = gameArea.querySelector(".food");

    if (oldFood) {
        oldFood.remove();
    }

    const foodElement = document.createElement("div");
    foodElement.classList.add("food");

    foodElement.style.left = `${((food.x + 0.1) / COLS) * 100}%`;
    foodElement.style.top = `${((food.y + 0.1) / ROWS) * 100}%`;

    gameArea.appendChild(
        foodElement
    );
}


function updateUI() {
    scoreElement.textContent = score;
    boardScoreElement.textContent = score;
    updateHighScore();
}

function updateHighScore() {
    const highScore = Number(localStorage.getItem("snakeHighScore") || 0);

    if (score > highScore) {
        localStorage.setItem("snakeHighScore", score);
    }

    highScoreElement.textContent = Math.max(score, highScore);
}


function gameOver() {
    gameRunning = false;
    gamePaused = false;

    if (gameLoop !== null) {
        clearInterval(gameLoop);
        gameLoop = null;
    }

    gameStatusElement.textContent = "GAME OVER";
    pauseButton.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
    updateUI();

    document.getElementById("final-score").textContent = score;
    gameOverModal.show();
}

function levelComplete() {
    gameRunning = false;
    gamePaused = false;

    if (gameLoop !== null) {
        clearInterval(gameLoop);
        gameLoop = null;
    }

    gameStatusElement.textContent = "COMPLETE";
    document.getElementById("complete-score").textContent = score;
    updateUI();
    levelCompleteModal.show();
}

function togglePause() {

    if (!gameRunning) {
        return;
    }

    gamePaused = !gamePaused;

    if (gamePaused) {
        gameStatusElement.textContent = "PAUSED";
        pauseButton.innerHTML = '<i class="fa-solid fa-play"></i> RESUME';

    } else {
        gameStatusElement.textContent = "PLAYING";
        pauseButton.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
    }
}

document.addEventListener(
    "keydown",
    function (event) {

        const key = event.key;

        // Chặn trình duyệt scroll khi dùng Arrow
        if (
            key === "ArrowUp" ||
            key === "ArrowDown" ||
            key === "ArrowLeft" ||
            key === "ArrowRight"
        ) {
            event.preventDefault();
        }

        if (
            key === "ArrowUp" && direction !== "DOWN"
        ) {
            nextDirection = "UP";
        }

        if (
            key === "ArrowDown" && direction !== "UP"
        ) {
            nextDirection = "DOWN";
        }

        if (
            key === "ArrowLeft" && direction !== "RIGHT"
        ) {
            nextDirection = "LEFT";
        }

        if (
            key === "ArrowRight" && direction !== "LEFT"
        ) {
            nextDirection = "RIGHT";
        }
    }
);

// button event
pauseButton.addEventListener(
    "click",
    togglePause
);

restartButton.addEventListener(
    "click",
    function () {
        startGame();
    }
);

document.getElementById("modal-restart").addEventListener(
        "click",
        function () {
            gameOverModal.hide();
            startGame();
        }
    );


document.getElementById("complete-restart").addEventListener(
        "click",
        function () {
            levelCompleteModal.hide();
            startGame();
        }
    );

document.getElementById("complete-next").addEventListener(
    "click",
    function () {
        levelCompleteModal.hide();

        const currentLevel = Number(levelElement.textContent);
        const nextLevel = currentLevel + 1;
        window.location.href = `index_${nextLevel}.html?level=${nextLevel}`;

    }
)

settingButton.addEventListener(
    "click",
    function () {

        alert(
            "Level 1\n\n" +
            "Use Arrow Keys to control the snake.\n" +
            "Eat food to increase your score.\n" +
            "Reach 100 points to complete Level 1."
        );
    }
);

startGame();
