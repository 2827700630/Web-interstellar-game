import { CONFIG } from './Config.js';
import { WeaponSystem, WEAPONS_CONFIG } from './weapon.js'; // 添加WEAPONS_CONFIG导入
import { ExplosionEffect } from './ExplosionEffect.js';
import { EnemyAI } from './AI.js';  // 添加这行导入

// 舰船基类，存储所有舰船的通用属性和方法
export class Ship {
    constructor(x, y) {
        this.x = x; // 舰船在游戏世界中的X坐标
        this.y = y; // 舰船在游戏世界中的Y坐标
        this.rotation = 0; // 当前旋转角度（度）
        this.velocity = { x: 0, y: 0 }; // 当前速度向量
    }
}

// 玩家飞船类，继承自Ship基类
export class PlayerShip extends Ship {
    constructor(game) {
        super(window.innerWidth / 2, window.innerHeight / 2); // 初始位置在屏幕中心
        this.game = game; // 游戏主实例的引用
        this.speed = 5; // 基础移动速度
        this.targetRotation = 0; // 目标旋转角度（用于平滑转向）
        this.rotationSpeed = 5; // 每秒旋转度数
        this.acceleration = 0.2; // 推进加速度值
        this.friction = 0.98; // 移动摩擦力系数（0-1）
        this.keys = { // 键盘状态跟踪对象
            up: false, // 前进键状态
            down: false, // 后退键状态
            left: false, // 左转键状态
            right: false // 右转键状态
        };
        this.element = document.querySelector('.spaceship'); // DOM元素引用
        this.weapon = new WeaponSystem(this); // 武器系统实例
        this.setupControls(); // 初始化控制绑定
        this.setupWeaponControls(); // 初始化武器控制
        this.health = CONFIG.PLAYER_MAX_HEALTH; // 当前生命值
        this.shield = CONFIG.PLAYER_MAX_SHIELD; // 当前护盾值
        this.statusDisplay = document.createElement('div'); // 状态显示面板
        this.statusDisplay.className = 'status-display';
        document.querySelector('.game-container').appendChild(this.statusDisplay);
        this.updateStatusDisplay(); // 初始化状态显示
        this.lastDamageTime = 0; // 上次受伤害时间戳（用于护盾再生延迟）
        this.lastShieldRegenTime = 0;// 上次护盾再生时间戳
    }
    // 绑定键盘控制事件
    setupControls() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    // 处理按键按下事件
    handleKeyDown(e) {
        switch (e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.up = true;     // 设置前进状态
                break;
            case 's':
            case 'arrowdown':
                this.keys.down = true;   // 设置后退状态
                break;
            case 'a':
            case 'arrowleft':
                this.keys.left = true;   // 设置左转状态
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = true;  // 设置右转状态
                break;
        }
    }

    // 处理按键释放事件
    handleKeyUp(e) {
        switch (e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.keys.up = false;    // 取消前进状态
                break;
            case 's':
            case 'arrowdown':
                this.keys.down = false;  // 取消后退状态
                break;
            case 'a':
            case 'arrowleft':
                this.keys.left = false;  // 取消左转状态
                break;
            case 'd':
            case 'arrowright':
                this.keys.right = false; // 取消右转状态
                break;
        }
    }

    // 绑定武器控制事件
    setupWeaponControls() {
        // 空格键开火
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.weapon.fire();  // 调用武器开火方法
            }
        });

        // 滚轮切换武器
        window.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.weapon.switchWeapon(); // 调用武器切换方法
        });
    }

    // 每帧更新飞船状态
    update() {
        if (this.disabled) return;  // 如果飞船被禁用则跳过更新

        // 处理转向输入
        if (this.keys.left) this.targetRotation -= this.rotationSpeed;
        if (this.keys.right) this.targetRotation += this.rotationSpeed;

        // 平滑转向插值计算（10%的转向进度）
        this.rotation += (this.targetRotation - this.rotation) * 0.1;

        // 将角度转换为弧度用于三角函数计算
        const rad = this.rotation * Math.PI / 180;

        // 处理推进输入
        if (this.keys.up) {
            // 根据飞船朝向分解速度分量
            this.velocity.x += Math.sin(rad) * this.acceleration;
            this.velocity.y -= Math.cos(rad) * this.acceleration;
        }
        // 处理反向推进（带有50%的减速效果）
        if (this.keys.down) {
            this.velocity.x -= Math.sin(rad) * this.acceleration * 0.5;
            this.velocity.y += Math.cos(rad) * this.acceleration * 0.5;
        }

        // 应用摩擦力
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        // 更新位置
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // 更新飞船DOM元素的显示位置和角度
        this.element.style.transform = `translate(-50%, -50%) rotate(${this.rotation}deg)`;
        this.weapon.update();  // 更新武器系统
        this.updateStatusDisplay();  // 更新状态显示

        // 护盾再生逻辑
        const now = performance.now();
        if (now - this.lastDamageTime > CONFIG.SHIELD.REGEN_DELAY &&    // 检查伤害冷却
            now - this.lastShieldRegenTime > CONFIG.SHIELD.REGEN_INTERVAL && // 检查再生间隔
            this.shield < CONFIG.PLAYER_MAX_SHIELD) {  // 检查护盾是否未满

            this.shield = Math.min(CONFIG.PLAYER_MAX_SHIELD, this.shield + CONFIG.SHIELD.REGEN_RATE);
            this.lastShieldRegenTime = now;
            this.updateStatusDisplay();
        }
    }

    // 更新状态显示面板
    updateStatusDisplay() {
        const weapon = WEAPONS_CONFIG[this.weapon.currentWeapon]; // 使用新的配置引用
        this.statusDisplay.innerHTML = `
        <div class="status-bar">
            <div class="status-label">生命值</div>
            <div class="status-value-bar">
                <div style="width: ${(this.health / CONFIG.PLAYER_MAX_HEALTH) * 100}%; 
                          background: rgba(255, 50, 50, 0.8);">
                </div>
            </div>
            <div class="status-number">${this.health}/${CONFIG.PLAYER_MAX_HEALTH}</div>
        </div>
        <div class="status-bar">
            <div class="status-label">护盾值</div>
            <div class="status-value-bar">
                <div style="width: ${(this.shield / CONFIG.PLAYER_MAX_SHIELD) * 100}%; 
                          background: rgba(50, 100, 255, 0.8);">
                </div>
            </div>
            <div class="status-number">${this.shield}/${CONFIG.PLAYER_MAX_SHIELD}</div>
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

    // 处理受到伤害的逻辑
    takeDamage(damage) {
        this.lastDamageTime = performance.now();  // 记录最后受伤时间

        // 优先扣除护盾
        if (this.shield > 0) {
            if (this.shield >= damage) {
                this.shield -= damage;
                damage = 0;
            } else {
                damage -= this.shield;
                this.shield = 0;
            }
        }

        // 剩余伤害扣除生命值
        if (damage > 0) {
            this.health = Math.max(0, this.health - damage);
            if (this.health <= 0) {
                this.die();  // 触发死亡
            }
        }

        this.updateStatusDisplay();
    }

    // 飞船销毁逻辑
    die() {
        const explosion = new ExplosionEffect(this.x, this.y, true); // 创建爆炸特效
        this.game.activeExplosions.push(explosion);
        this.element.style.display = 'none';  // 隐藏飞船元素
        this.disabled = true;  // 禁用飞船控制

        // 创建游戏结束提示
        const gameOver = document.createElement('div');
        gameOver.className = 'game-over';
        gameOver.innerHTML = `
        <h1>游戏结束</h1>
        <p>你的飞船被摧毁了</p>
    `;
        document.querySelector('.game-container').appendChild(gameOver);
    }
}

// 敌方飞船类，继承自Ship基类
export class Enemy extends Ship {
    constructor(game) {
        super(0, 0);
        this.game = game;
        this.element = this.createEnemyElement();
        this.ai = new EnemyAI(this); // 初始化AI控制器
        this.health = 50;
        this.reset();
    }
    // 创建敌方飞船的DOM元素
    createEnemyElement() {
        const element = document.createElement('div');
        element.className = 'enemy-ship';
        const body = document.createElement('div');
        body.className = 'enemy-ship-body';
        element.appendChild(body);
        document.querySelector('.game-container').appendChild(element);
        return element;
    }

    // 重置敌方飞船状态（用于生成和重生）
    reset() {
        // 在玩家周围随机生成位置
        const angle = Math.random() * Math.PI * 2;  // 随机角度
        const distance = CONFIG.ENEMY.MIN_DISTANCE +
            Math.random() * (CONFIG.ENEMY.MAX_DISTANCE - CONFIG.ENEMY.MIN_DISTANCE);

        // 计算生成坐标
        this.x = this.game.playerShip.x + Math.cos(angle) * distance;
        this.y = this.game.playerShip.y + Math.sin(angle) * distance;

        this.rotation = 0;           // 重置旋转角度
        this.velocity = { x: 0, y: 0 };  // 重置速度
        this.lastFireTime = 0;       // 重置最后开火时间
        this.health = 50;            // 重置生命值

        // 更新DOM元素位置
        const screenX = this.x - this.game.playerShip.x + window.innerWidth / 2;
        const screenY = this.y - this.game.playerShip.y + window.innerHeight / 2;
        this.element.style.display = '';
        this.element.style.transform = `translate(${screenX}px, ${screenY}px) rotate(${this.rotation}deg)`;
    }

    // 每帧更新敌方行为
    update() {
        // 由AI控制行为
        this.ai.update();

        // 更新位置
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // 更新视觉显示
        const screenX = this.x - this.game.playerShip.x + window.innerWidth / 2;
        const screenY = this.y - this.game.playerShip.y + window.innerHeight / 2;
        this.element.style.transform = `translate(${screenX}px, ${screenY}px) rotate(${this.rotation}deg)`;
    }

    // 发射子弹
    fire() {
        const rad = this.rotation * Math.PI / 180;  // 转换为弧度
        // 创建弹道数据
        const projectile = {
            x: this.x,
            y: this.y,
            vx: Math.sin(rad) * 8,  // X方向速度分量
            vy: -Math.cos(rad) * 8, // Y方向速度分量
            rotation: this.rotation, // 弹道旋转角度
            isEnemy: true,          // 标记为敌方子弹
            life: 1000,             // 子弹存活时间（毫秒）
            element: this.createProjectileElement() // 创建子弹DOM元素
        };

        this.game.enemyProjectiles.push(projectile);  // 添加到游戏实例
    }

    // 创建子弹DOM元素
    createProjectileElement() {
        const element = document.createElement('div');
        element.className = 'projectile weapon-type-1';
        element.style.filter = 'hue-rotate(180deg)';  // 颜色调整区分敌我
        document.querySelector('.game-container').appendChild(element);
        return element;
    }

    // 销毁敌方飞船
    destroy() {
        this.element.remove();  // 移除DOM元素
    }

    // 处理敌方受伤逻辑
    takeDamage(damage) {
        this.health -= damage;

        if (this.health <= 0) {
            // 转换为屏幕坐标生成爆炸特效
            const screenX = this.x - this.game.playerShip.x + window.innerWidth / 2;
            const screenY = this.y - this.game.playerShip.y + window.innerHeight / 2;
            const explosion = new ExplosionEffect(screenX, screenY);
            this.game.activeExplosions.push(explosion);

            this.destroy();  // 销毁敌方元素
            // 从敌人数组中移除
            const index = this.game.enemies.indexOf(this);
            if (index > -1) {
                this.game.enemies.splice(index, 1);
            }
        }
    }
}