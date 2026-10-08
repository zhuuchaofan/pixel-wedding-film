# 追捕「幽灵粒子」—— 8-bit 科普短片

2026 年诺贝尔物理学奖授予 **弗朗西斯·哈尔岑（Francis Halzen）**，表彰他对 IceCube（冰立方）中微子天文台的决定性贡献，以及发现来自宇宙的高能中微子。

- 成片：[`out/nobel-2026-icecube.mp4`](out/nobel-2026-icecube.mp4)（1280×720，30fps，106 秒，带中文字幕和芯片音乐）
- 风格：320×180 像素画布，仅用 PICO-8 16 色调色板，4× 最近邻放大；Unifont 点阵字体；拜耳抖动转场。

## 分镜

| 时间 | 内容 |
| --- | --- |
| 0–7s | 片头：诺贝尔奖章 · 标题 |
| 7–21s | 什么是中微子：太阳喷射，每秒约 650 亿个穿过指甲盖 |
| 21–36s | 为什么重要：光被尘埃挡住、宇宙射线被磁场带偏，只有中微子直线抵达 |
| 36–46s | 为什么难抓：能穿过整个地球 → 需要约 1 立方公里的探测器 |
| 46–63s | 哈尔岑的设想：把南极冰盖变成探测器（86 根电缆、5160 个传感器、1450–2450 米深） |
| 63–77s | 探测原理：中微子撞击 → μ子 → 契伦科夫光 → 传感器亮起 |
| 77–95s | 成果：2013 首批宇宙高能中微子、2018 耀变体 TXS 0506+056、2022 NGC 1068、2023 银河系中微子图 |
| 95–106s | 结尾：中微子天文学，一扇新窗户 |

## 制作

```bash
cd nobel-2026-icecube && python3 music.py && cd ..   # 生成 8-bit 背景音乐（需要 numpy）
node engine/render.mjs nobel-2026-icecube             # 逐帧渲染 → out/nobel-2026-icecube.mp4（需要 playwright + ffmpeg）
node engine/render.mjs nobel-2026-icecube out/s --png 15,60   # 只导出若干秒的截图用于检查
```

直接用浏览器打开 `index.html` 可以预览、拖动进度条。

资料来源：[NobelPrize.org](https://www.nobelprize.org/prizes/physics/2026/summary/)、IceCube 合作组公开资料。
