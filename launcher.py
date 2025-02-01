import os
import sys
import webbrowser
import http.server
import socketserver
import threading
import time

def start_server():
    # 获取当前目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # 配置简单的HTTP服务器
    Handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("", 8000), Handler)
    
    print("游戏服务器已启动在 http://localhost:8000")
    httpd.serve_forever()

def main():
    # 在新线程中启动服务器
    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True
    server_thread.start()
    
    # 等待服务器启动
    time.sleep(1)
    
    # 打开浏览器
    webbrowser.open('http://localhost:8000/game.html')
    
    print("游戏已在浏览器中启动")
    print("要退出游戏，请关闭此窗口")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n正在关闭游戏...")
        sys.exit(0)

if __name__ == "__main__":
    main()
