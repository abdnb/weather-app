# Weather App

一个功能丰富的天气预报应用，结合了Web界面和命令行工具的优点，提供多种查看和获取天气信息的方式。采用现代化设计，提供优雅的用户体验。

## 主要特点

- **现代美观的UI设计**：
  - 使用渐变色和磨砂玻璃效果
  - 动态交互效果和平滑过渡动画
  - 响应式设计，适配不同设备
  - 明暗两种主题模式

  - 复制curl命令功能


  - 日期和星期本地化显示

## 设计特点

- **视觉元素**：
  - 磨砂玻璃效果卡片设计
  - 动态悬停效果增强交互体验
  - 精美图标和平滑动画
  - 优化的字体和排版
  - 渐变色和光影效果

- **用户体验**：
  - 简洁直观的信息布局
  - 流畅的动画过渡
  - 优化的明暗模式切换
  - 响应式布局适配各种设备

## 技术栈

- HTML5
- CSS3 (Flexbox, Grid, 响应式设计, 动画效果)
- JavaScript (ES6+)
- Google Fonts (Poppins, Nunito)
- Font Awesome 图标
- 第三方API:
  - Open-Meteo API
  - wttr.in API
- Leaflet.js (地图功能)

## 使用方法

1. 打开`index.html`文件在现代浏览器中查看应用
2. 在搜索框中输入城市名称来查询天气
3. 点击定位按钮自动获取当前位置天气
4. 使用选项卡切换不同视图模式
5. 在终端视图中选择不同的显示格式
6. 使用底部的功能按钮切换温度单位、切换主题模式
7. 享受流畅的动画和交互效果

## 终端视图格式选项

- 默认格式：完整的天气预报
- 简洁格式1：只显示当前天气和温度
- 简洁格式2：显示当前天气、温度和风速
- 简洁格式3：显示城市名和当前天气
- 简洁格式4：显示城市名、当前天气、温度和风速
- 自定义格式：使用wttr.in的格式参数自定义显示内容

## 自定义格式符号含义

```
c    天气状况图标
C    天气状况文字描述
x    天气状况纯文本符号
h    湿度
t    当前温度
f    体感温度
w    风向风速
l    位置

## 项目结构

- `index.html` - 主页面
- `styles.css` - 样式文件
- `app.js` - 主应用逻辑
- `weather-service.js` - Open-Meteo API服务
- `wttr-service.js` - wttr.in API服务
- `map-service.js` - 地图功能
- `utils.js` - 工具函数
- `assets/` - 字体和其他资源

## 浏览器兼容性

应用支持所有现代浏览器，包括但不限于：

- Chrome
- Firefox
- Safari
- Edge

## 未来计划

- 增加更多地图图层数据
- 添加日出日落可视化功能
- 支持多地点天气比较
- 添加PWA支持和离线功能
- 历史天气数据图表
- 天气警报通知
- 增强动画效果和交互体验

## 致谢

本项目基于以下开源项目和服务：

- [wttr.in](https://github.com/chubin/wttr.in) - 终端友好的天气服务
- [Open-Meteo](https://open-meteo.com/) - 免费开放的天气API
- [Leaflet](https://leafletjs.com/) - 开源互动地图库
- [Google Fonts](https://fonts.google.com/) - 网页字体服务
- [Font Awesome](https://fontawesome.com/) - 图标库

## 许可

MIT License 