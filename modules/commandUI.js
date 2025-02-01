import { CONFIG } from './Config.js';
import { PlayerShip } from './ship.js';
import { Enemy } from './ship.js';
import { WEAPONS_CONFIG } from './weapon.js';  // 添加武器配置导入

// 游戏界面，包括命令HUD和星空显示系统
// 负责管理所有视觉元素的显示和更新

// 星星类 - 用于创建动态星空背景
export class Star {
    constructor(canvas) {
        this.canvas = canvas;    // 保存画布引用
        this.reset();           // 初始化星星属性
    }

    // 重置星星属性 - 随机生成位置、大小和速度
    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.size = Math.random() * (CONFIG.MAX_STAR_SIZE - CONFIG.MIN_STAR_SIZE) + CONFIG.MIN_STAR_SIZE;
        this.speed = Math.random() * (CONFIG.MAX_SPEED - CONFIG.MIN_SPEED) + CONFIG.MIN_SPEED;
        this.brightness = Math.random() * 0.3 + 0.7;
        this.flickerDelta = Math.random() * 0.05 - 0.025;
    }

    // 更新星星状态 - 处理移动和闪烁效果
    update() {
        this.y += this.speed;
        if (this.y > this.canvas.height) {
            this.reset();
            this.y = 0;
        }

        if (Math.random() < CONFIG.FLICKER_CHANCE) {
            this.brightness += this.flickerDelta;
            this.brightness = Math.max(0.7, Math.min(1, this.brightness));
        }
    }

    // 绘制星星 - 在画布上渲染单个星星
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
        ctx.fill();
    }
}

// 星空背景系统 - 管理整个游戏的背景效果
export class StarField {
    constructor() {
        // 获取画布和上下文
        this.canvas = document.getElementById('starCanvas');
        this.ctx = this.canvas.getContext('2d');

        // FPS计数相关
        this.frames = 0;
        this.lastTime = performance.now();
        this.lastFpsUpdate = 0;
        this.currentFps = 0;
        this.fpsCounter = document.getElementById('fpsCounter');

        // 游戏对象初始化
        this.stars = [];                    // 星星数组
        this.activeExplosions = [];         // 活动的爆炸效果
        this.enemies = [];                  // 敌人数组
        this.enemyProjectiles = [];         // 敌人子弹

        // 初始化游戏
        this.resizeCanvas();                // 设置画布尺寸
        this.init();                        // 初始化星空
        this.playerShip = new PlayerShip(this);  // 创建玩家飞船
        this.initEnemies();                 // 初始化敌人

        // 绑定方法
        this.checkProjectileCollisions = this.checkProjectileCollisions.bind(this);

        // 监听窗口大小变化
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.init();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    init() {
        this.stars = Array(CONFIG.STAR_COUNT).fill(null).map(() => new Star(this.canvas));
    }

    initEnemies() {
        for (let i = 0; i < CONFIG.ENEMY.COUNT; i++) {
            this.enemies.push(new Enemy(this));
        }
    }

    update() {
        this.playerShip.update();

        this.stars.forEach(star => {
            star.x -= this.playerShip.velocity.x;
            star.y -= this.playerShip.velocity.y;

            if (star.x < 0) star.x = this.canvas.width;
            if (star.x > this.canvas.width) star.x = 0;
            if (star.y < 0) star.y = this.canvas.height;
            if (star.y > this.canvas.height) star.y = 0;
        });

        this.enemies.forEach(enemy => enemy.update());

        this.enemyProjectiles = this.enemyProjectiles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            if (p.life <= 0) {
                p.element.remove();
                return false;
            }

            const screenX = p.x - this.playerShip.x + window.innerWidth / 2;
            const screenY = p.y - this.playerShip.y + window.innerHeight / 2;

            p.element.style.transform = `translate(${screenX}px, ${screenY}px) rotate(${p.rotation}deg)`;
            return true;
        });

        this.checkProjectileCollisions();

        this.activeExplosions = this.activeExplosions.filter(explosion => {
            return explosion.update();
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.stars.forEach(star => star.draw(this.ctx));
    }

    calculateFps() {
        const now = performance.now();
        this.frames++;
        if (now - this.lastFpsUpdate >= 1000) {
            this.currentFps = Math.round(this.frames * 1000 / (now - this.lastFpsUpdate));
            this.fpsCounter.textContent = `FPS: ${this.currentFps}`;
            this.frames = 0;
            this.lastFpsUpdate = now;
        }
    }

    checkProjectileCollisions() {
        this.enemyProjectiles = this.enemyProjectiles.filter(p => {
            const dx = (p.x - this.playerShip.x);
            const dy = (p.y - this.playerShip.y);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 25) {
                this.playerShip.takeDamage(10);
                p.element.remove();
                return false;
            }
            return true;
        });

        this.enemies.forEach(enemy => {
            this.playerShip.weapon.projectiles = this.playerShip.weapon.projectiles.filter(p => {
                const dx = (p.x - enemy.x);
                const dy = (p.y - enemy.y);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 20) {
                    enemy.takeDamage(WEAPONS_CONFIG[p.type].damage); // 修改这里
                    p.element.remove();
                    return false;
                }
                return true;
            });
        });
    }
}

// 命令界面HUD系统 - 处理游戏界面的信息显示
export class CommandHUD {
    constructor() {
        // 获取HUD画布和上下文
        this.canvas = document.getElementById('hudCanvas');
        this.ctx = this.canvas.getContext('2d');

        // 设置画布尺寸
        this.resizeCanvas();

        // 添加窗口大小变化监听
        window.addEventListener('resize', () => this.resizeCanvas());

        // 创建统一UI容器
        this.createUIContainer();
        // 启动UI初始化动画
        this.initializeUI();
    }

    createUIContainer() {
        this.uiContainer = document.createElement('div');
        this.uiContainer.className = 'game-ui';
        document.querySelector('.game-container').appendChild(this.uiContainer);
        
        // 将所有UI元素移到容器中
        this.uiContainer.appendChild(this.canvas);  // HUD画布
        const statusDisplay = document.querySelector('.status-display');
        if (statusDisplay) {
            this.uiContainer.appendChild(statusDisplay);
        }
    }

    initializeUI() {
        // 创建扫描线
        const scanLine = document.createElement('div');
        scanLine.className = 'ui-scan-line';
        this.uiContainer.appendChild(scanLine);

        // 创建启动文本
        const bootText = document.createElement('div');
        bootText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #00ffff;
            font-family: monospace;
            text-align: center;
            opacity: 0;
            animation: fadeIn 0.5s ease-out 0.5s forwards, fadeOut 0.5s ease-out 1.2s forwards;
        `;
        bootText.innerHTML = `
            初始化指挥系统...<br>
            加载战术数据...<br>
            系统启动完成
        `;
        this.uiContainer.appendChild(bootText);

        // 自动清理启动动画元素
        setTimeout(() => {
            scanLine.remove();
            bootText.remove();
        }, 1500);
    }

    resizeCanvas() {
        this.canvas.width = CONFIG.SIDEBAR_WIDTH;
        this.canvas.height = window.innerHeight;
    }

    // 绘制HUD区域 - 创建具有科幻风格的界面区块
    drawSection(x, y, w, h) {
        this.ctx.save();
        // 背景渐变
        const gradient = this.ctx.createLinearGradient(0, y, 0, y + h);
        gradient.addColorStop(0, 'rgba(0, 30, 60, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 50, 100, 0.9)');

        // 边框光效 
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 15;
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeRect(x, y, w, h);
        this.ctx.restore();
    }

    drawShipStatus() {
        // 只绘制底部战术地图信息
        this.drawMinimap();
    }

    // 绘制小地图 - 显示战术态势
    drawMinimap() {
        // 设置小地图位置和大小
        const sectionY = window.innerHeight * 0.7;
        const sectionHeight = window.innerHeight * 0.3 - 10;

        // 绘制小地图背景
        this.drawSection(5, sectionY, CONFIG.SIDEBAR_WIDTH - 10, sectionHeight);

        // 绘制网格系统
        this.ctx.save();
        this.ctx.translate(15, sectionY + 15);
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        this.ctx.lineWidth = 0.5;

        // 绘制垂直网格线
        for (let x = 0; x < CONFIG.SIDEBAR_WIDTH - 30; x += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, sectionHeight - 30);
            this.ctx.stroke();
        }

        // 绘制水平网格线
        for (let y = 0; y < sectionHeight - 30; y += 30) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(CONFIG.SIDEBAR_WIDTH - 30, y);
            this.ctx.stroke();
        }

        // 绘制玩家位置指示器
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        this.ctx.arc(50, 50, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawMinimap();  // 只更新小地图
    }
}

// 状态显示系统 - 显示玩家状态信息
export class StatusDisplay {
    constructor(player) {
        this.player = player;
        this.element = document.createElement('div');
        this.element.className = 'status-display';
        document.querySelector('.game-container').appendChild(this.element);
    }

    update() {
        const weapon = WEAPONS_CONFIG[this.player.weapon.currentWeapon];  // 更新为新的配置引用
        this.element.innerHTML = `
            <div class="status-bar">
                <div class="status-label">生命值</div>
                <div class="status-value-bar">
                    <div style="width: ${(this.player.health / CONFIG.PLAYER_MAX_HEALTH) * 100}%; 
                              background: rgba(255, 50, 50, 0.8);">
                    </div>
                </div>
                <div class="status-number">${this.player.health}/${CONFIG.PLAYER_MAX_HEALTH}</div>
            </div>
            <div class="status-bar">
                <div class="status-label">护盾值</div>
                <div class="status-value-bar">
                    <div style="width: ${(this.player.shield / CONFIG.PLAYER_MAX_SHIELD) * 100}%; 
                              background: rgba(50, 100, 255, 0.8);">
                    </div>
                </div>
                <div class="status-number">${this.player.shield}/${CONFIG.PLAYER_MAX_SHIELD}</div>
            </div>
            <div class="weapon-status">
                <div class="status-bar">
                    <div class="status-label">${weapon.name}</div>
                    <div class="status-value-bar">
                        <div style="width: ${(weapon.ammo / weapon.maxAmmo) * 100}%; 
                                  background: rgba(255, 170, 0, 0.8);">
                        </div>
                    </div>
                    <div class="status-number">${weapon.ammo}/${weapon.maxAmmo}</div>
                </div>
            </div>
        `;
    }
}

