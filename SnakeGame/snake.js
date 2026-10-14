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

//LEVEL 2
const currentLevel = Number(levelElement?.textContent) || 1;

const LEVEL_CONFIGS = {
    1: {
        targetScore: 100,
        speed: 180,
        getWalls: () => []
    },
    2: {
        targetScore: 200,
        speed: 160,
        getWalls: () => generateRandomWallCluster(8, 5)

    }
}

const currentConfig = LEVEL_CONFIGS[currentLevel] || LEVEL_CONFIGS[1];


// Game state
let snake = [];
let food = {x: 10, y: 10};
let currentWalls = [];

let direction = "RIGHT";
let nextDirection = "RIGHT";

let score = 0;
let gameRunning = false;
let gamePaused = false;
let gameLoop = null;

// Random vị trí rắn xuất hiện
function generateRandomSnake(walls) {
    const directions = ["UP", "DOWN", "LEFT", "RIGHT"];
    const margin = 4;
    const SNAKE_INITIAL_LENGTH = 3;

    let isSafe = false;
    let newSnake = [];
    let randomDir = "RIGHT";

    while (!isSafe) {
        randomDir = directions[Math.floor(Math.random() * directions.length)];
        const headX = Math.floor(Math.random() * (COLS - margin * 2)) + margin;
        const headY = Math.floor(Math.random() * (ROWS - margin * 2)) + margin;

        newSnake = [{x: headX, y: headY}];


        for (let i = 1; i < SNAKE_INITIAL_LENGTH; i++) {
            let segmentX = headX;
            let segmentY = headY;

            switch (randomDir) {
                case "RIGHT": segmentX = headX - i; break;
                case "LEFT":  segmentX = headX + i; break;
                case "UP":    segmentY = headY + i; break;
                case "DOWN":  segmentY = headY - i; break;
        }

            newSnake.push({ x: segmentX, y: segmentY });
    }
        const isCollideWithWall = newSnake.some(segment =>
                walls.some(wall => wall.x === segment.x && wall.y === segment.y)
    );

        if (!isCollideWithWall) {
            isSafe = true;
        }
    }
    direction = randomDir;
    nextDirection = randomDir;
    return newSnake;
}


// Start game
function startGame() {

    if (gameLoop !== null) {
        clearInterval(gameLoop);
        gameLoop = null;
    }

    currentWalls = currentConfig.getWalls ? currentConfig.getWalls() : [];

    snake = generateRandomSnake(currentWalls);
    createFood();
    score = 0;
    gameRunning = true;
    gamePaused = false;

    levelElement.textContent = currentLevel;
    targetElement.textContent = currentConfig.targetScore;
    gameStatusElement.textContent = "PLAYING";
    pauseButton.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
    gameArea.innerHTML = "";

    renderWalls();
    renderSnake();
    renderFood();
    updateUI();

    gameLoop = setInterval(
        updateGame,
        currentConfig.speed
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

    const hitWall = currentWalls.some(wall => wall.x === head.x && wall.y === head.y);
    if (hitWall) {
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

        if (score >= currentConfig.targetScore) {
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

        const onSnake = snake.some(
            segment => segment.x === newFood.x && segment.y === newFood.y
        );


        const onWall = currentWalls.some(
            wall => wall.x === newFood.x && wall.y === newFood.y
        );


        positionIsValid = !onSnake && !onWall;
    }

    food = newFood;
}

function renderWalls() {
    currentWalls.forEach((wall) => {
        const wallElement = document.createElement("div");
        wallElement.classList.add("wall");
        wallElement.style.left = `${(wall.x / COLS) * 100}%`;
        wallElement.style.top = `${(wall.y / ROWS) * 100}%`;
        gameArea.appendChild(wallElement);
    });
}


function generateRandomWallCluster(numClusters, clusterLength) {
    const walls = [];
    for (let i = 0; i < numClusters; i++) {
        let validCluster = false;
        let attemps = 0;

        while (!validCluster && attemps < 50) {
            attemps ++;
            const startX = Math.floor(Math.random() * (COLS - 8)) + 4;
            const startY = Math.floor(Math.random() * (ROWS - 8)) + 4;
            const isHorizontal = Math.random() > 0.5;

            const tempCluster = [];
            let overlap = false;

            for (let j = 0; j < clusterLength; j++) {
                const wallX = isHorizontal ? startX + j : startX;
                const wallY = isHorizontal ? startY : startY + j;

                const isNearCenter = wallX >= 9 && wallX <= 15 && wallY >= 9 && wallY <= 15;
                const isDuplicate = walls.some(w => w.x === wallX && w.y === wallY);

                if (isNearCenter || isDuplicate) {
                    overlap = true;
                    break;
                }
                tempCluster.push({x: wallX, y: wallY});
            }
            if (!overlap) {
                walls.push(...tempCluster);
                validCluster = true;
            }
        }
    }
    return walls;
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
    const storageKey = `snakeHighScore_Level_${currentLevel}`;
    const highScore = Number(localStorage.getItem(storageKey) || 0);

    if (score > highScore) {
        localStorage.setItem(storageKey, score);
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

        const hasWalls = currentConfig.getWalls && currentConfig.getWalls.length > 0;
        alert(
            `Hướng dẫn - Level ${currentLevel}\n\n` +
            "Dùng các phím mũi tên để điều khiển rắn.\n" +
            "Ăn mồi để tích lũy điểm.\n" +
            (hasWalls ? "Tránh đụng vào các bức tường trên màn chơi.\n" : "") +
            `Đạt ${currentConfig.targetScore} điểm để hoàn thành màn chơi!`
        );
    }
);

startGame();
