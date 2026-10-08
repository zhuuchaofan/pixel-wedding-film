"""生成 8-bit 芯片音乐背景（方波旋律 + 脉冲琶音 + 三角波低音 + 噪声鼓）。

用法: python3 music.py [输出路径]  （默认 music.wav，时长与动画一致 106 秒）
"""
import sys
import wave

import numpy as np

SR = 22050
DUR = 106.0
BPM = 112
BEAT = 60 / BPM

freq = lambda m: 440.0 * 2 ** ((m - 69) / 12)
buf = np.zeros(int(SR * (DUR + 8)))


def tone(start, length, midi, vol, kind="square", duty=0.5):
    n = int(length * SR)
    if n <= 0:
        return
    t = np.arange(n) / SR
    ph = (t * freq(midi)) % 1.0
    if kind == "square":
        w = np.where(ph < duty, 1.0, -1.0)
    else:  # NES 风格的 4-bit 量化三角波
        w = np.round((4 * np.abs(ph - 0.5) - 1) * 7) / 7
    env = np.minimum(1, t / 0.004) * np.exp(-t * 2.5) * np.minimum(1, (length - t) / 0.01)
    i = int(start * SR)
    buf[i:i + n] += w * env * vol


def noise(start, length, vol, decay=40):
    n = int(length * SR)
    rng = np.random.default_rng(int(start * 1000))
    t = np.arange(n) / SR
    w = np.repeat(rng.choice([-1.0, 1.0], n // 4 + 1), 4)[:n]
    i = int(start * SR)
    buf[i:i + n] += w * np.exp(-t * decay) * vol


def kick(start, vol=0.35):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    f = 120 * np.exp(-t * 30) + 40
    ph = np.cumsum(f) / SR % 1.0
    w = np.round((4 * np.abs(ph - 0.5) - 1) * 7) / 7
    i = int(start * SR)
    buf[i:i + n] += w * np.exp(-t * 18) * vol


# A 小调: Am - F - C - G
CHORDS = [(45, [57, 60, 64, 69]), (41, [53, 57, 60, 65]), (48, [55, 60, 64, 67]), (43, [55, 59, 62, 67])]
MELODY = [
    [(76, 1), (81, 1), (84, 1), (83, 1)], [(81, 1.5), (79, .5), (77, 1), (76, 1)],
    [(79, 1), (76, 1), (72, 1), (76, 1)], [(74, 2), (71, 1), (74, 1)],
    [(76, .5), (76, .5), (81, 1), (84, 1), (88, 1)], [(86, 1.5), (84, .5), (81, 2)],
    [(79, 1), (84, 1), (76, 1), (79, 1)], [(83, 2), (86, 1), (83, 1)],
]
ARP = [0, 1, 2, 3, 2, 1, 2, 3, 0, 2, 1, 3, 2, 1, 0, 1]

bar = 0
t = 0.0
while t < DUR:
    root, notes = CHORDS[bar % 4]
    intro = t < 7.0                      # 片头只有琶音和低音
    for k in range(16):                  # 十六分音符琶音（25% 占空比脉冲波）
        tone(t + k * BEAT / 4, BEAT / 4 * 0.9, notes[ARP[k]] + 12, 0.06, duty=0.25)
    for k in range(8):                   # 八分音符三角波低音
        tone(t + k * BEAT / 2, BEAT / 2 * 0.85, root + (12 if k % 2 else 0), 0.22, kind="tri")
    if not intro:
        for k in range(4):
            if k % 2 == 0:
                kick(t + k * BEAT)
            else:
                noise(t + k * BEAT, 0.12, 0.10, decay=25)
            noise(t + k * BEAT + BEAT / 2, 0.04, 0.04)
        mt = t
        for m, d in MELODY[bar % 8]:     # 50% 方波主旋律
            tone(mt, d * BEAT * 0.92, m, 0.075)
            mt += d * BEAT
    t += 4 * BEAT
    bar += 1

out = buf[:int(SR * DUR)]
ts = np.arange(len(out)) / SR
out *= np.minimum(1, ts / 1.5) * np.clip((DUR - ts) / 3.0, 0, 1)
out = out / max(1e-9, np.abs(out).max()) * 0.8
pcm = (out * 32767).astype("<i2")

path = sys.argv[1] if len(sys.argv) > 1 else "music.wav"
with wave.open(path, "wb") as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes(pcm.tobytes())
print("wrote", path, f"{DUR}s")
