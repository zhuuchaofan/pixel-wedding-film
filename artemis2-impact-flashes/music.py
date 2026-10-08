"""《宇航员亲眼看见月球被陨石击中！》背景音乐：D 小调 8-bit 芯片音乐 + 闪光/撞击音效，88 秒。

用法: python3 music.py [输出路径]  （默认 music.wav）
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "engine"))
from chiptune import Track  # noqa: E402

# D 小调: Dm - Bb - F - C
CHORDS = [(38, [57, 62, 65, 69]), (34, [58, 62, 65, 70]), (41, [57, 60, 65, 69]), (36, [55, 60, 64, 67])]
MELODY = [
    [(81, 1), (77, 1), (74, 1), (77, 1)], [(79, 1.5), (77, .5), (74, 2)],
    [(72, 1), (77, 1), (81, 1), (79, 1)], [(76, 2), (72, 1), (76, 1)],
    [(74, .5), (77, .5), (81, 1), (86, 1), (84, 1)], [(82, 1.5), (81, .5), (77, 2)],
    [(81, 1), (77, 1), (72, 1), (77, 1)], [(79, 2), (76, 1), (None, 1)],
]
ARP = [0, 2, 1, 3, 0, 2, 1, 3, 0, 1, 2, 3, 2, 1, 3, 1]

tr = Track(dur=88.0)
tr.song(bpm=100, chords=CHORDS, melody=MELODY, arp=ARP, intro=7.0, lead_vol=0.065)
# 与画面同步的音效：片头闪光、舷窗里的 5 次闪光、两次撞击、结尾闪光
for s in (5.5, 10.0, 12.5, 14.8, 17.0, 19.2, 84.0):
    tr.ping(s)
for s in (41.0, 47.0):
    tr.boom(s)
tr.save(sys.argv[1] if len(sys.argv) > 1 else "music.wav")
