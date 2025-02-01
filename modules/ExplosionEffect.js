import { CONFIG } from './Config.js';

// 粒子特效系统
// 负责处理游戏中的爆炸、碎片等视觉特效

export class ExplosionEffect {
    // 构造函数
    // x, y: 爆炸效果的中心位置
    // isPlayer: 是否是玩家飞船的爆炸(玩家爆炸效果会更大更华丽)
    constructor(x, y, isPlayer = false) {
        // 如果是玩家爆炸，将位置固定在屏幕中心
        this.x = isPlayer ? window.innerWidth / 2 : x;
        this.y = isPlayer ? window.innerHeight / 2 : y;
        this.particles = [];      // 爆炸粒子数组
        this.debris = [];         // 飞船碎片数组
        this.isPlayer = isPlayer; // 记录是否为玩家爆炸
        this.createExplosion();   // 创建爆炸效果
    }

    // 创建爆炸效果
    // 生成爆炸粒子和碎片
    createExplosion() {
        // 创建爆炸粒子
        for (let i = 0; i < 20; i++) {
            // 随机计算粒子参数
            const angle = (Math.random() * 360) * Math.PI / 180;  // 随机角度
            const speed = 2 + Math.random() * 3;                  // 随机速度
            const life = 60 + Math.random() * 20;                 // 随机生命周期
            
            // 创建粒子对象
            const particle = {
                element: this.createParticle(),     // 创建粒子DOM元素
                x: this.x,                          // 初始X位置
                y: this.y,                          // 初始Y位置
                vx: Math.cos(angle) * speed,        // X方向速度
                vy: Math.sin(angle) * speed,        // Y方向速度
                life: life,                         // 当前生命值
                maxLife: life,                      // 最大生命值
                rotation: Math.random() * 360       // 随机旋转角度
            };
            this.particles.push(particle);
        }

        // 如果是玩家飞船爆炸，添加更多的碎片效果
        if (this.isPlayer) {
            for (let i = 0; i < 8; i++) {
                // 随机计算碎片参数
                const angle = (Math.random() * 360) * Math.PI / 180;
                const speed = 1 + Math.random() * 2;
                const size = 5 + Math.random() * 10;
                
                // 创建碎片对象
                const debris = {
                    element: this.createDebris(size),    // 创建碎片DOM元素
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    rotation: Math.random() * 360,       // 初始旋转角度
                    rotationSpeed: (Math.random() - 0.5) * 10,  // 旋转速度
                    life: 120                           // 碎片生命周期
                };
                this.debris.push(debris);
            }
        }
    }

    // 创建单个爆炸粒子的DOM元素
    createParticle() {
        const element = document.createElement('div');
        element.className = 'explosion-particle';
        document.querySelector('.game-container').appendChild(element);
        return element;
    }

    // 创建单个飞船碎片的DOM元素
    createDebris(size) {
        const element = document.createElement('div');
        element.className = 'ship-debris';
        element.style.width = size + 'px';
        element.style.height = size + 'px';
        document.querySelector('.game-container').appendChild(element);
        return element;
    }

    // 更新爆炸效果
    // 返回布尔值表示特效是否仍在活跃
    update() {
        let active = false;  // 标记是否还有活跃的粒子或碎片

        // 更新所有爆炸粒子
        this.particles = this.particles.filter(p => {
            p.life--;  // 递减生命值
            if (p.life <= 0) {    // 生命值耗尽则移除
                p.element.remove();
                return false;
            }

            // 更新粒子位置和旋转
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += 10;

            // 根据剩余生命值计算透明度
            const opacity = p.life / p.maxLife;
            // 应用变换
            p.element.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`;
            p.element.style.opacity = opacity;
            
            active = true;
            return true;
        });

        // 更新所有飞船碎片
        this.debris = this.debris.filter(d => {
            d.life--;  // 递减生命值
            if (d.life <= 0) {    // 生命值耗尽则移除
                d.element.remove();
                return false;
            }

            // 更新碎片位置和旋转
            d.x += d.vx;
            d.y += d.vy;
            d.rotation += d.rotationSpeed;
            
            // 根据剩余生命值计算透明度
            const opacity = d.life / 120;
            // 应用变换
            d.element.style.transform = `translate(${d.x}px, ${d.y}px) rotate(${d.rotation}deg)`;
            d.element.style.opacity = opacity;
            
            active = true;
            return true;
        });

        return active;  // 返回是否还有活跃的特效
    }
}
