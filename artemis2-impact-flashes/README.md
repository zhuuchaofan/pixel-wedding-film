# 宇航员亲眼看见月球被陨石击中！—— 8-bit 科普短片

2026 年 4 月 6 日 Artemis II 飞越月球时，宇航员用肉眼看到了月面上 5 次极其微弱的撞击闪光；
10 月 7 日 NASA 公开月球科学数据（800GB+、11000+ 张图片和视频、8.5 小时观察录音），
科学团队排除了宇宙射线和飞船反光，确认了这些观测。

- 成片：[`out/artemis2-impact-flashes.mp4`](out/artemis2-impact-flashes.mp4)（1280×720，30fps，88 秒，中文字幕 + 芯片音乐 + 闪光/撞击音效）

## 分镜

| 时间 | 内容 |
| --- | --- |
| 0–7s | 开头钩子：“如果你盯着月球看得足够久，有没有可能亲眼看到一颗陨石撞上去？” |
| 7–22s | 飞船舷窗：月球挡住太阳（日冕），漆黑月面上依次出现 5 次针尖闪光并编号 |
| 22–31s | NASA 数据公开 · 排除宇宙射线和飞船反光 |
| 31–44s | 流星体 / 流星 / 陨石：地球有大气层 vs 月球几乎没有大气 |
| 44–58s | 撞击模拟：每秒 20–70 公里 → 汽化闪光 → 溅射 → 小撞击坑 |
| 58–70s | 为什么地球上很难看到：太短（<0.1 秒）、太暗（只能看暗面）、太远（远 5 倍 → 暗约 27 倍） |
| 70–81s | 为什么要统计：时间·位置·亮度 → 撞击频率 → 月球基地防护设计 |
| 81–88s | 结尾：月球并不安静 |

## 制作

```bash
cd artemis2-impact-flashes && python3 music.py && cd ..   # 背景音乐 + 音效（需要 numpy）
node engine/render.mjs artemis2-impact-flashes             # 渲染 MP4（需要 playwright + ffmpeg）
```

## 资料来源

- NASA：[NASA Releases Artemis II Lunar Science Data, Images](https://www.nasa.gov/blogs/missions/2026/10/07/nasa-releases-artemis-ii-lunar-science-data-images/)（2026-10-07）
- NASA Science：[Artemis II Preliminary Lunar Science Report](https://science.nasa.gov/feature/artemis-ii-preliminary-lunar-science-report/)
- 撞击速度、撞击物大小与撞击坑尺寸：NASA 流星体环境办公室月面撞击监测；NELIOTA 月面撞击闪光统计（[arXiv:2403.19613](https://arxiv.org/abs/2403.19613)）
