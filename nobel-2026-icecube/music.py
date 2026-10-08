"""《追捕「幽灵粒子」》背景音乐：A 小调 8-bit 芯片音乐，106 秒。

用法: python3 music.py [输出路径]  （默认 music.wav）
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "engine"))
from chiptune import Track  # noqa: E402

# A 小调: Am - F - C - G
CHORDS = [(45, [57, 60, 64, 69]), (41, [53, 57, 60, 65]), (48, [55, 60, 64, 67]), (43, [55, 59, 62, 67])]
MELODY = [
    [(76, 1), (81, 1), (84, 1), (83, 1)], [(81, 1.5), (79, .5), (77, 1), (76, 1)],
    [(79, 1), (76, 1), (72, 1), (76, 1)], [(74, 2), (71, 1), (74, 1)],
    [(76, .5), (76, .5), (81, 1), (84, 1), (88, 1)], [(86, 1.5), (84, .5), (81, 2)],
    [(79, 1), (84, 1), (76, 1), (79, 1)], [(83, 2), (86, 1), (83, 1)],
]
ARP = [0, 1, 2, 3, 2, 1, 2, 3, 0, 2, 1, 3, 2, 1, 0, 1]

tr = Track(dur=106.0)
tr.song(bpm=112, chords=CHORDS, melody=MELODY, arp=ARP, intro=7.0)
tr.save(sys.argv[1] if len(sys.argv) > 1 else "music.wav")
