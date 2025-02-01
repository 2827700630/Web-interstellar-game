// 配置文件
// 存放游戏全局配置参数和通用功能

// 全屏控制功能
// 处理游戏全屏模式的切换和按钮状态更新
export function initFullscreenControl() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    // 切换全屏状态
    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            // 进入全屏模式
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`全屏请求失败: ${err.message}`);
            });
        } else {
            // 退出全屏模式
            document.exitFullscreen();
        }
    }

    // 更新全屏按钮文本
    function updateFullscreenButtonText() {
        fullscreenBtn.textContent = document.fullscreenElement ? '退出全屏' : '全屏';
    }

    // 绑定事件监听器
    fullscreenBtn.addEventListener('click', toggleFullScreen);
    document.addEventListener('fullscreenchange', updateFullscreenButtonText);
}

// 游戏核心配置参数
export const CONFIG = {
    // 星空背景配置
    STAR_COUNT: 800,           // 星星数量 - 影响背景星空的密度
    MIN_STAR_SIZE: 0.5,        // 最小星星尺寸 - 像素单位
    MAX_STAR_SIZE: 1.5,        // 最大星星尺寸 - 像素单位
    MIN_SPEED: 0.1,            // 最小移动速度 - 影响视差效果
    MAX_SPEED: 0.6,            // 最大移动速度 - 影响视差效果
    FLICKER_CHANCE: 0.05,      // 闪烁概率 - 每帧星星闪烁的概率

    // 界面配置
    SIDEBAR_WIDTH: 300,        // HUD侧边栏宽度 - 像素单位
    GRID_SIZE: 30,             // 网格大小 - 用于小地图网格
    HUD_UPDATE_INTERVAL: 100,  // HUD更新间隔 - 毫秒

    // 玩家属性配置
    PLAYER_MAX_HEALTH: 100,    // 玩家最大生命值
    PLAYER_MAX_SHIELD: 100,    // 玩家最大护盾值

    // 敌人AI配置
    ENEMY: {
        COUNT: 3,              // 敌人数量 - 同时出现的敌人数
        MIN_DISTANCE: 300,     // 最小距离 - 敌人生成的最小距离
        MAX_DISTANCE: 800,     // 最大距离 - 敌人生成的最大距离
        SPEED: 3,             // 基础速度 - 敌人移动速度
        ROTATION_SPEED: 3,     // 旋转速度 - 敌人转向速度
        ATTACK_RANGE: 400,     // 攻击范围 - 敌人开始攻击的距离
        FIRE_RATE: 1500       // 开火间隔 - 毫秒
    },

    // 护盾系统配置
    SHIELD: {
        REGEN_DELAY: 5000,    // 护盾恢复延迟 - 受伤后多久开始恢复(毫秒)
        REGEN_RATE: 10,       // 护盾恢复速率 - 每次恢复量
        REGEN_INTERVAL: 1000  // 护盾恢复间隔 - 恢复频率(毫秒)
    }
};