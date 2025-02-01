#include <stdio.h>
#include <stdlib.h>
#include <windows.h>

int main() {
    // 启动Python HTTP服务器
    system("start /B python -m http.server 8000");
    
    // 等待服务器启动
    Sleep(1000);
    
    // 打开默认浏览器
    system("start http://localhost:8000/game.html");
    
    printf("游戏已启动，关闭此窗口即可退出游戏...\n");
    printf("按任意键退出...");
    getchar();
    
    // 关闭服务器
    system("taskkill /F /IM python.exe >nul 2>nul");
    
    return 0;
}
