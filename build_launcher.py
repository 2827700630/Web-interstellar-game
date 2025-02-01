import os
import PyInstaller.__main__

# 图标
icon = '''
iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA...
''' # 这里是base64编码的图标数据

# 保存图标
with open('game.ico', 'wb') as icon_file:
    import base64
    icon_file.write(base64.b64decode(icon))

# 配置PyInstaller选项
PyInstaller.__main__.run([
    'launcher.py',
    '--onefile',
    '--noconsole',
    '--icon=game.ico',
    '--name=星际指挥系统',
    '--clean',
])

# 删除临时图标
os.remove('game.ico')
