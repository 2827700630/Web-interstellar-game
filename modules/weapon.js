import { CONFIG } from './Config.js';

// 武器系统配置
export const WEAPONS_CONFIG = [
    {
        name: "相位炮",         
        speed: 15,             
        damage: 10,            
        cooldown: 200,         
        color: 'rgba(255, 100, 0, 0.8)',  
        ammo: 100,             
        maxAmmo: 100           
    },
    {
        name: "离子炮",         
        speed: 10,             
        damage: 20,            
        cooldown: 500,         
        color: 'rgba(0, 200, 255, 0.8)',  
        ammo: 50,              
        maxAmmo: 50            
    }
];

// 武器系统模块
// 负责管理玩家武器的发射、切换和弹药管理

export class WeaponSystem {
    constructor(ship) {
        this.ship = ship;              // 存储飞船引用
        this.projectiles = [];         // 存储所有活跃的子弹
        this.currentWeapon = 0;        // 当前选择的武器索引
        this.lastFireTime = 0;         // 上次开火时间，用于控制射速
    }

    // 武器开火方法
    fire() {
        const now = performance.now();
        const weapon = WEAPONS_CONFIG[this.currentWeapon];  // 获取当前武器配置

        // 检查弹药是否耗尽
        if (weapon.ammo <= 0) {
            this.showNoAmmoWarning();
            return;
        }

        // 检查武器冷却时间
        if (now - this.lastFireTime < weapon.cooldown) return;

        // 消耗弹药
        weapon.ammo--;

        // 计算发射角度和初始位置
        const rad = this.ship.rotation * Math.PI / 180;
        // 创建子弹对象
        const projectile = {
            x: window.innerWidth / 2,           // 从屏幕中心发射
            y: window.innerHeight / 2,
            vx: Math.sin(rad) * weapon.speed,   // 计算子弹速度向量
            vy: -Math.cos(rad) * weapon.speed,
            rotation: this.ship.rotation,        // 子弹旋转角度
            type: this.currentWeapon,           // 武器类型
            life: 1000,                         // 子弹生命周期
            element: this.createProjectileElement(this.currentWeapon)  // 创建视觉元素
        };

        // 立即设置子弹初始位置，避免视觉延迟
        projectile.element.style.transform = `translate(${projectile.x}px, ${projectile.y}px) rotate(${projectile.rotation}deg)`;

        // 将子弹添加到活跃列表
        this.projectiles.push(projectile);
        this.lastFireTime = now;
        this.ship.updateStatusDisplay();  // 更新UI显示
    }

    // 更新所有子弹状态
    update() {
        this.projectiles = this.projectiles.filter(p => {
            // 更新子弹位置
            p.x += p.vx;
            p.y += p.vy;
            p.life--;  // 递减生命周期

            // 检查是否命中目标
            const hit = this.checkHit(p);
            if (hit) {
                p.element.remove();
                return false;
            }

            // 检查生命周期
            if (p.life <= 0) {
                p.element.remove();
                return false;
            }

            // 应用视差效果：根据飞船速度调整子弹显示位置
            const displayX = p.x - this.ship.velocity.x;
            const displayY = p.y - this.ship.velocity.y;

            // 更新子弹视觉效果
            p.element.style.transform = `translate(${displayX}px, ${displayY}px) rotate(${p.rotation}deg)`;
            return true;
        });
    }

    // 检查子弹是否命中敌人
    checkHit(projectile) {
        for (let enemy of this.ship.game.enemies) {
            // 计算子弹与敌人的距离
            const dx = enemy.x - (projectile.x + this.ship.x - window.innerWidth / 2);
            const dy = enemy.y - (projectile.y + this.ship.y - window.innerHeight / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 检查是否在碰撞范围内
            if (distance < 20) {
                const damage = WEAPONS_CONFIG[projectile.type].damage;
                this.createHitEffect(enemy, damage);  // 创建命中特效
                enemy.takeDamage(damage);             // 造成伤害
                return true;
            }
        }
        return false;
    }

    // 创建命中特效
    createHitEffect(enemy, damage) {
        // 根据伤害大小缩放特效
        const scale = 1 + (damage / 10);  // 每10点伤害增加1倍大小

        // 创建闪光效果
        const flash = document.createElement('div');
        flash.className = 'hit-flash';
        flash.style.transform = `scale(${scale})`;
        enemy.element.appendChild(flash);
        setTimeout(() => flash.remove(), 200);

        // 创建火花效果
        const spark = document.createElement('div');
        spark.className = 'hit-spark';
        const screenX = enemy.x - this.ship.game.playerShip.x + window.innerWidth / 2;
        const screenY = enemy.y - this.ship.game.playerShip.y + window.innerHeight / 2;
        spark.style.left = screenX + 'px';
        spark.style.top = screenY + 'px';
        spark.style.transform = `translate(-50%, -50%) scale(${scale})`;
        document.querySelector('.game-container').appendChild(spark);
        setTimeout(() => spark.remove(), 300);
    }

    // 创建子弹视觉元素
    createProjectileElement(type) {
        const element = document.createElement('div');
        element.className = `projectile weapon-type-${type + 1}`;
        document.querySelector('.game-container').appendChild(element);
        return element;
    }

    // 切换武器
    switchWeapon() {
        this.currentWeapon = (this.currentWeapon + 1) % WEAPONS_CONFIG.length;
        this.ship.updateStatusDisplay();
    }

    // 显示弹药耗尽警告
    showNoAmmoWarning() {
        const warning = document.createElement('div');
        warning.className = 'ammo-warning';
        warning.textContent = '弹药耗尽！';
        document.body.appendChild(warning);
        setTimeout(() => warning.remove(), 1000);
    }
}
