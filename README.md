# pixel-wedding-film

8-bit 像素风科普短片。`main` 分支只放通用引擎，每部短片放在各自的分支里：

| 分支 | 短片 | 时长 |
| --- | --- | --- |
| `claude/video-nobel-2026-icecube` | 《追捕「幽灵粒子」》—— 2026 诺贝尔物理学奖 · IceCube 中微子 | 106 秒 |
| `claude/video-artemis2-impact-flashes` | 《宇航员亲眼看见月球被陨石击中！》—— Artemis II 月面撞击闪光 | 88 秒 |

新短片：从 `main` 新建分支，加一个短片目录（`index.html` + `music.py`）。

## 引擎 `engine/`

- `pixel8.js`：320×180 画布、PICO-8 16 色、Unifont 点阵字、拜耳抖动转场、字幕与预览播放器。短片的 `index.html` 引入 `../engine/pixel8.js`，只写场景函数，最后调用 `film({ scenes, subs, duration })`。
- `render.mjs`：`node engine/render.mjs <短片目录>`，用 Playwright 逐帧截图 + ffmpeg 合成 MP4（自动带上该目录的 `music.wav`）。
- `chiptune.py`：方波 / 三角波 / 噪声的芯片音乐与音效（`ping` 闪光、`boom` 撞击），短片的 `music.py` 调用它。
