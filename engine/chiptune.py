"""pixel8 芯片音乐小工具：方波 / 三角波 / 噪声，NES 风格。

    from chiptune import Track
    tr = Track(dur=86)
    tr.song(bpm=112, chords=[...], melody=[...], arp=[...], intro=7.0)
    tr.ping(12.5)          # 音效
    tr.save("music.wav")
"""
import wave

import numpy as np

SR = 22050


def freq(m):
    return 440.0 * 2 ** ((m - 69) / 12)


class Track:
    def __init__(self, dur, sr=SR):
        self.dur, self.sr = dur, sr
        self.buf = np.zeros(int(sr * (dur + 8)))

    def _add(self, start, w):
        i = int(start * self.sr)
        if i < 0 or i >= len(self.buf):
            return
        w = w[:len(self.buf) - i]
        self.buf[i:i + len(w)] += w

    def tone(self, start, length, midi, vol, kind="square", duty=0.5):
        n = int(length * self.sr)
        if n <= 0:
            return
        t = np.arange(n) / self.sr
        ph = (t * freq(midi)) % 1.0
        if kind == "square":
            w = np.where(ph < duty, 1.0, -1.0)
        else:  # NES 风格的 4-bit 量化三角波
            w = np.round((4 * np.abs(ph - 0.5) - 1) * 7) / 7
        env = np.minimum(1, t / 0.004) * np.exp(-t * 2.5) * np.minimum(1, (length - t) / 0.01)
        self._add(start, w * env * vol)

    def noise(self, start, length, vol, decay=40):
        n = int(length * self.sr)
        rng = np.random.default_rng(int(start * 1000))
        t = np.arange(n) / self.sr
        w = np.repeat(rng.choice([-1.0, 1.0], n // 4 + 1), 4)[:n]
        self._add(start, w * np.exp(-t * decay) * vol)

    def kick(self, start, vol=0.35):
        n = int(0.12 * self.sr)
        t = np.arange(n) / self.sr
        f = 120 * np.exp(-t * 30) + 40
        ph = np.cumsum(f) / self.sr % 1.0
        w = np.round((4 * np.abs(ph - 0.5) - 1) * 7) / 7
        self._add(start, w * np.exp(-t * 18) * vol)

    # ---- 音效 ----
    def ping(self, start, vol=0.12):
        """闪光“叮”：快速上行的高音方波。"""
        for k, m in enumerate((91, 96, 103)):
            self.tone(start + k * 0.03, 0.09, m, vol, duty=0.125)

    def boom(self, start, vol=0.3):
        """撞击：低频下坠 + 长噪声尾巴。"""
        self.kick(start, vol)
        self.kick(start + 0.05, vol * 0.7)
        self.noise(start, 0.8, vol * 0.6, decay=6)

    def song(self, bpm, chords, melody, arp, intro=0.0, start=0.0, end=None, arp_vol=0.06, bass_vol=0.22, lead_vol=0.075):
        """chords: [(低音 midi, [和弦音 midi x4]), ...] 每小节一个；melody: 每小节 [(midi 或 None, 拍数), ...]。"""
        beat = 60 / bpm
        end = self.dur if end is None else end
        bar, t = 0, start
        while t < end:
            root, notes = chords[bar % len(chords)]
            for k in range(16):                  # 十六分音符琶音（25% 占空比脉冲波）
                self.tone(t + k * beat / 4, beat / 4 * 0.9, notes[arp[k]] + 12, arp_vol, duty=0.25)
            for k in range(8):                   # 八分音符三角波低音
                self.tone(t + k * beat / 2, beat / 2 * 0.85, root + (12 if k % 2 else 0), bass_vol, kind="tri")
            if t >= intro:                       # 片头只有琶音和低音
                for k in range(4):
                    if k % 2 == 0:
                        self.kick(t + k * beat)
                    else:
                        self.noise(t + k * beat, 0.12, 0.10, decay=25)
                    self.noise(t + k * beat + beat / 2, 0.04, 0.04)
                mt = t
                for m, d in melody[bar % len(melody)]:   # 50% 方波主旋律
                    if m is not None:
                        self.tone(mt, d * beat * 0.92, m, lead_vol)
                    mt += d * beat
            t += 4 * beat
            bar += 1

    def save(self, path, fade_in=1.5, fade_out=3.0):
        out = self.buf[:int(self.sr * self.dur)].copy()
        ts = np.arange(len(out)) / self.sr
        out *= np.minimum(1, ts / fade_in) * np.clip((self.dur - ts) / fade_out, 0, 1)
        out = out / max(1e-9, np.abs(out).max()) * 0.8
        pcm = (out * 32767).astype("<i2")
        with wave.open(path, "wb") as f:
            f.setnchannels(1)
            f.setsampwidth(2)
            f.setframerate(self.sr)
            f.writeframes(pcm.tobytes())
        print("wrote", path, f"{self.dur}s")
