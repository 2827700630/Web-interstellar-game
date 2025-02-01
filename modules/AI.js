import { CONFIG } from './Config.js';

// 存放AI逻辑数据
// 这个模块负责控制敌方飞船的人工智能行为

// 敌人行为状态枚举
// 定义了敌方飞船的三种基本行为模式
export const EnemyState = {
    CHASE: 'chase',      // 追击状态 - 当与玩家距离较远时主动追击
    ATTACK: 'attack',    // 攻击状态 - 在攻击范围内时进行攻击
    RETREAT: 'retreat'   // 撤退状态 - 当距离玩家过近时后退保持距离
};

// 敌方AI控制器类
export class EnemyAI {
    constructor(enemy) {
        this.enemy = enemy;                    // 存储对敌方飞船实例的引用
        this.currentState = EnemyState.CHASE;  // 初始状态设置为追击
    }

    // 主更新方法 - 每帧调用
    update() {
        const playerShip = this.enemy.game.playerShip;  // 获取玩家飞船引用
        // 计算与玩家的距离向量
        const dx = playerShip.x - this.enemy.x;
        const dy = playerShip.y - this.enemy.y;
        // 计算实际距离
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 计算目标角度 - 使敌机始终朝向玩家
        // 加90度是因为精灵图方向朝上
        const targetAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        
        // 实现平滑转向
        const angleDiff = targetAngle - this.enemy.rotation;
        // 使用较小的角度进行旋转，避免过度旋转
        this.enemy.rotation += Math.sign(angleDiff) * 
            Math.min(Math.abs(angleDiff), CONFIG.ENEMY.ROTATION_SPEED);

        // 更新AI状态并执行对应行为
        this.updateState(distance);
        this.executeState(dx, dy, distance);
    }

    // 状态更新方法 - 根据与玩家的距离决定行为状态
    updateState(distance) {
        // 根据与玩家的距离切换不同状态
        if (distance > CONFIG.ENEMY.ATTACK_RANGE * 1.2) {
            // 距离过远，进入追击状态
            this.currentState = EnemyState.CHASE;
        } else if (distance > CONFIG.ENEMY.ATTACK_RANGE * 0.8) {
            // 在合适距离，进入攻击状态
            this.currentState = EnemyState.ATTACK;
        } else {
            // 距离过近，进入撤退状态
            this.currentState = EnemyState.RETREAT;
        }
    }

    // 状态执行方法 - 根据当前状态执行具体行为
    executeState(dx, dy, distance) {
        switch (this.currentState) {
            case EnemyState.CHASE:
                // 追击状态：全速向玩家移动
                this.enemy.velocity.x = dx / distance * CONFIG.ENEMY.SPEED;
                this.enemy.velocity.y = dy / distance * CONFIG.ENEMY.SPEED;
                break;

            case EnemyState.ATTACK:
                // 攻击状态：降低速度并尝试攻击
                this.enemy.velocity.x = dx / distance * CONFIG.ENEMY.SPEED * 0.5;
                this.enemy.velocity.y = dy / distance * CONFIG.ENEMY.SPEED * 0.5;
                this.tryToFire();
                break;

            case EnemyState.RETREAT:
                // 撤退状态：缓慢后退并持续攻击
                this.enemy.velocity.x = -dx / distance * CONFIG.ENEMY.SPEED * 0.3;
                this.enemy.velocity.y = -dy / distance * CONFIG.ENEMY.SPEED * 0.3;
                this.tryToFire();
                break;
        }
    }

    // 尝试开火方法 - 检查开火冷却并执行攻击
    tryToFire() {
        const now = performance.now();
        // 检查是否超过开火冷却时间
        if (now - this.enemy.lastFireTime > CONFIG.ENEMY.FIRE_RATE) {
            this.enemy.fire();
            this.enemy.lastFireTime = now;
        }
    }
}