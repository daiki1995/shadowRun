// ===================================
// SHADOW RUN - 2D Endless Runner
// ===================================

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 600;

// Input System
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
});
window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

// Game Constants
const GRAVITY = 0.8;
const GROUND_Y = 480;

// Player Images
const playerImages = {
    run1: new Image(),
    run2: new Image(),
    jump: new Image(),
    sliding: new Image(),
    wjump: new Image()
};
playerImages.run1.src = 'Run1.png';
playerImages.run2.src = 'Run2.png';
playerImages.jump.src = 'jump.png';
playerImages.sliding.src = 'Sliding.png';
playerImages.wjump.src = 'wjump.png';

// Obstacle Images
const obstacleImages = {
    jumpObstacle: new Image(),  // ジャンプで避ける障害物
    duckObstacle: new Image()   // スライディングで避ける障害物
};
obstacleImages.jumpObstacle.src = 'obstacle_jump.png';
obstacleImages.duckObstacle.src = 'obstacle_duck.png';

// Game State
let gameSpeed = 6;
let score = 0;
let totalFrames = 0;
let gameOver = false;
let gameStarted = false;

// Player States
const PlayerState = {
    RUN: 'run',
    JUMP: 'jump',
    FLIP: 'flip',
    SLIDE: 'slide'
};

// Player Object
const player = {
    x: 150,
    y: GROUND_Y - 60,  // 足元が地面に来るように調整
    width: 30,
    height: 60,
    velocityY: 0,
    state: PlayerState.RUN,
    isOnGround: true,
    hasDoubleJumped: false,
    rotation: 0,
    
    // 当たり判定を状態に応じて変更
    getHitbox() {
        switch(this.state) {
            case PlayerState.SLIDE:
                return { x: this.x, y: this.y + 35, width: 60, height: 25 };
            case PlayerState.FLIP:
                return { x: this.x + 5, y: this.y + 15, width: 30, height: 30 };
            default:
                return { x: this.x, y: this.y, width: 30, height: 60 };
        }
    },
    
    jump() {
        if (this.isOnGround) {
            this.velocityY = -16;
            this.isOnGround = false;
            this.state = PlayerState.JUMP;
            this.hasDoubleJumped = false;
        } else if (!this.hasDoubleJumped) {
            // 2段ジャンプ（宙返り）
            this.velocityY = -14;
            this.hasDoubleJumped = true;
            this.state = PlayerState.FLIP;
            this.rotation = 0;
        }
    },
    
    update() {
        // 重力の適用
        this.velocityY += GRAVITY;
        this.y += this.velocityY;
        
        // プラットフォーム上にいるかチェック
        let onPlatform = false;
        if (this.y + this.height >= GROUND_Y) {
            platforms.forEach(platform => {
                if (this.x + this.width > platform.x && 
                    this.x < platform.x + platform.width &&
                    this.y + this.height >= GROUND_Y &&
                    this.y + this.height <= GROUND_Y + 20) {
                    onPlatform = true;
                }
            });
        }
        
        // 地面との衝突（プラットフォーム上のみ）
        if (this.y + this.height >= GROUND_Y && onPlatform) {
            this.y = GROUND_Y - this.height;
            this.velocityY = 0;
            this.isOnGround = true;
            this.hasDoubleJumped = false;
            this.rotation = 0;
            
            // 地上での状態管理
            if (keys['ArrowDown']) {
                this.state = PlayerState.SLIDE;
            } else {
                this.state = PlayerState.RUN;
            }
        } else {
            this.isOnGround = false;
            
            // 空中での状態管理
            if (this.state === PlayerState.FLIP) {
                this.rotation += 0.3;
            }
            
            // 空中でのスライディング（急降下）
            if (keys['ArrowDown'] && this.state !== PlayerState.FLIP) {
                this.velocityY = Math.max(this.velocityY, 8);
            }
        }
        
        // 落下時の状態
        if (!this.isOnGround && this.state === PlayerState.RUN) {
            this.state = PlayerState.JUMP;
        }
    },
    
    draw() {
        ctx.save();
        
        const hitbox = this.getHitbox();
        
        // 地面に接地している時は影を表示
        if (this.isOnGround) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(this.x, GROUND_Y, 40, 5);
        }
        
        // 宙返りの回転
        if (this.state === PlayerState.FLIP) {
            // 2段ジャンプ時の画像表示（回転あり）
            if (playerImages.wjump.complete && playerImages.wjump.naturalWidth > 0) {
                ctx.translate(this.x + 15, this.y + 30);
                ctx.rotate(this.rotation);
                ctx.drawImage(playerImages.wjump, -15, -15, 30, 30);
            } else {
                ctx.translate(this.x + 15, this.y + 30);
                ctx.rotate(this.rotation);
                ctx.fillStyle = '#000';
                ctx.fillRect(-15, -15, 30, 30);
            }
        } else if (this.state === PlayerState.SLIDE) {
            // スライディング時の画像表示
            if (playerImages.sliding.complete && playerImages.sliding.naturalWidth > 0) {
                ctx.drawImage(playerImages.sliding, hitbox.x, hitbox.y, hitbox.width, hitbox.height);
            } else {
                ctx.fillStyle = '#000';
                ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
            }
        } else if (this.state === PlayerState.JUMP) {
            // ジャンプ時の画像表示
            if (playerImages.jump.complete && playerImages.jump.naturalWidth > 0) {
                ctx.drawImage(playerImages.jump, hitbox.x, hitbox.y, hitbox.width, hitbox.height);
            } else {
                ctx.fillStyle = '#000';
                ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
            }
        } else {
            // 通常の描画
            // 走行時のアニメーション（画像切り替え）
            if (this.state === PlayerState.RUN) {
                // 10フレームごとに画像を切り替え
                const frameSwitch = Math.floor(totalFrames / 10) % 2;
                const currentImage = frameSwitch === 0 ? playerImages.run1 : playerImages.run2;
                
                // 画像が読み込まれていれば画像を描画、そうでなければ四角形
                if (currentImage.complete && currentImage.naturalWidth > 0) {
                    ctx.drawImage(currentImage, hitbox.x, hitbox.y, hitbox.width, hitbox.height);
                } else {
                    ctx.fillStyle = '#000';
                    ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
                }
            } else {
                // ジャンプ時などは黒い四角形
                ctx.fillStyle = '#000';
                ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
            }
        }
        
        ctx.restore();
        
        // デバッグ用当たり判定の表示（オプション）
        // ctx.strokeStyle = 'red';
        // ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    }
};

// Platform/Building System
class Platform {
    constructor(x, width, hasGap = false) {
        this.x = x;
        this.y = GROUND_Y;
        this.width = width;
        this.height = canvas.height - GROUND_Y;
        this.hasGap = hasGap;
    }
    
    update() {
        this.x -= gameSpeed;
    }
    
    draw() {
        // 地面の上部に線を引いて位置を明確に
        ctx.fillStyle = '#f7f5f5ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 地面の境界線（透明）
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y);
        ctx.stroke();
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
}

// Obstacle System
class Obstacle {
    constructor(x, platformY, type) {
        this.x = x;
        this.type = type; // 'jump' or 'duck'
        
        if (type === 'jump') {
            // 飛び越える障害物
            this.y = platformY - 40;
            this.width = 40;
            this.height = 40;
        } else {
            // くぐり抜ける障害物（低めの位置）
            this.y = platformY - 80;
            this.width = 60;
            this.height = 30;
        }
    }
    
    update() {
        this.x -= gameSpeed;
    }
    
    draw() {
        // 障害物の画像表示
        if (this.type === 'jump') {
            // ジャンプで避ける障害物
            if (obstacleImages.jumpObstacle.complete && obstacleImages.jumpObstacle.naturalWidth > 0) {
                ctx.drawImage(obstacleImages.jumpObstacle, this.x, this.y, this.width, this.height);
            } else {
                ctx.fillStyle = '#000';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                // タンク風の装飾
                ctx.fillRect(this.x + 5, this.y - 10, 30, 10);
            }
        } else {
            // スライディングで避ける障害物（わかりやすく赤色）
            if (obstacleImages.duckObstacle.complete && obstacleImages.duckObstacle.naturalWidth > 0) {
                ctx.drawImage(obstacleImages.duckObstacle, this.x, this.y, this.width, this.height);
            } else {
                ctx.fillStyle = '#ff0000';  // 赤色に変更
                ctx.fillRect(this.x, this.y, this.width, this.height);
                // パイプ風の装飾
                ctx.fillRect(this.x - 10, this.y + 10, 10, 10);
                ctx.fillRect(this.x + this.width, this.y + 10, 10, 10);
            }
        }
    }
    
    isOffScreen() {
        return this.x + this.width < 0;
    }
    
    collidesWith(playerHitbox) {
        return playerHitbox.x < this.x + this.width &&
               playerHitbox.x + playerHitbox.width > this.x &&
               playerHitbox.y < this.y + this.height &&
               playerHitbox.y + playerHitbox.height > this.y;
    }
}

// Background Parallax Layers
class ParallaxLayer {
    constructor(speed, color, yOffset = 0) {
        this.speed = speed;
        this.color = color;
        this.x = 0;
        this.yOffset = yOffset;
        this.elements = [];
        this.generateElements();
    }
    
    generateElements() {
        // 背景要素の生成
        for (let i = 0; i < 10; i++) {
            this.elements.push({
                x: i * 200,
                y: 100 + Math.random() * 200,
                width: 60 + Math.random() * 80,
                height: 150 + Math.random() * 200
            });
        }
    }
    
    update() {
        this.x -= gameSpeed * this.speed;
        
        // ループ処理
        if (this.x <= -200) {
            this.x += 200;
        }
    }
    
    draw() {
        ctx.fillStyle = this.color;
        this.elements.forEach(el => {
            const drawX = el.x + this.x;
            ctx.fillRect(drawX, el.y + this.yOffset, el.width, el.height);
            // ループのため2回描画
            if (drawX < canvas.width) {
                ctx.fillRect(drawX + 2000, el.y + this.yOffset, el.width, el.height);
            }
        });
    }
}

// Game Objects
let platforms = [];
let obstacles = [];
let backgroundLayers = [];

// Initialize Game
function initGame() {
    gameSpeed = 6;
    score = 0;
    totalFrames = 0;
    gameOver = false;
    gameStarted = true;
    
    player.y = GROUND_Y - player.height;
    player.velocityY = 0;
    player.state = PlayerState.RUN;
    player.isOnGround = true;
    player.hasDoubleJumped = false;
    player.rotation = 0;
    
    platforms = [];
    obstacles = [];
    
    // 初期プラットフォームの生成
    for (let i = 0; i < 5; i++) {
        platforms.push(new Platform(i * 300, 300));
    }
    
    // 背景レイヤーの初期化
    backgroundLayers = [
        new ParallaxLayer(0.01, '#e0e0e0'), // 最遠景（ほぼ動かない）
        new ParallaxLayer(0.3, '#c0c0c0'),  // 中景
    ];
}

// Spawn New Platform
function spawnPlatform() {
    const lastPlatform = platforms[platforms.length - 1];
    const hasGap = Math.random() < 0.3; // 30%の確率で隙間
    const gapSize = hasGap ? 100 + Math.random() * 100 : 0;
    const newWidth = 200 + Math.random() * 200;
    
    platforms.push(new Platform(
        lastPlatform.x + lastPlatform.width + gapSize,
        newWidth,
        hasGap
    ));
}

// Spawn Obstacle
function spawnObstacle() {
    if (platforms.length > 0 && Math.random() < 0.02) {
        const platform = platforms[platforms.length - 1];
        const type = Math.random() < 0.5 ? 'jump' : 'duck';
        obstacles.push(new Obstacle(platform.x + platform.width / 2, GROUND_Y, type));
    }
}

// Update Game
function update() {
    if (!gameStarted || gameOver) return;
    
    totalFrames++;
    score = Math.floor(totalFrames / 10);
    
    // 速度の増加
    if (totalFrames % 300 === 0) {
        gameSpeed += 0.5;
    }
    
    // 背景レイヤーの更新
    backgroundLayers.forEach(layer => layer.update());
    
    // プラットフォームの更新
    platforms.forEach(platform => platform.update());
    platforms = platforms.filter(platform => !platform.isOffScreen());
    
    // 新しいプラットフォームの生成
    if (platforms.length < 5) {
        spawnPlatform();
    }
    
    // 障害物の更新
    obstacles.forEach(obstacle => obstacle.update());
    obstacles = obstacles.filter(obstacle => !obstacle.isOffScreen());
    spawnObstacle();
    
    // プレイヤーの更新
    player.update();
    
    // 衝突判定
    checkCollisions();
    
    // スコア更新
    document.getElementById('score').textContent = `DISTANCE: ${score}`;
}

// Collision Detection
function checkCollisions() {
    const playerHitbox = player.getHitbox();
    
    // 障害物との衝突
    obstacles.forEach(obstacle => {
        if (obstacle.collidesWith(playerHitbox)) {
            gameOver = true;
        }
    });
    
    // 落下判定
    if (player.y > canvas.height) {
        gameOver = true;
    }
}

// Draw Game
function draw() {
    // 背景クリア（白背景）
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 月の描画（薄いグレー）
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.arc(1000, 100, 50, 0, Math.PI * 2);
    ctx.fill();
    
    // 背景レイヤー
    backgroundLayers.forEach(layer => layer.draw());
    
    // プラットフォーム
    platforms.forEach(platform => platform.draw());
    
    // 障害物
    obstacles.forEach(obstacle => obstacle.draw());
    
    // プレイヤー
    player.draw();
    
    // ゲームオーバー表示
    if (gameOver) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 60px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.font = '30px Courier New';
        ctx.fillText(`DISTANCE: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        
        ctx.font = '20px Courier New';
        ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 60);
    }
    
    if (!gameStarted) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 40px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height / 2);
    }
}

// Input Handling
function handleInput() {
    if (keys['Space'] && !gameStarted) {
        initGame();
    }
    
    if (keys['KeyR'] && gameOver) {
        initGame();
    }
    
    if (!gameOver && gameStarted) {
        if (keys['Space']) {
            player.jump();
            keys['Space'] = false; // 連続ジャンプ防止
        }
    }
}

// Game Loop
function gameLoop() {
    handleInput();
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start Game
gameLoop();
