"""Подтягивает новые видеообзоры с канала RikaNV в src/data/media.ts.

Источники: канал RikaNV на RuTube (список видео с длительностью) и RSS канала на YouTube
(youtube.com/@RikaNV). Обзором считается видео от 4 минут, в названии которого есть модель
из нашей линейки (Kaban, Moskit, Dovod, Sinica, Snegir, Strekoza/BRF). Новости, эфиры и шортсы
пропускаются. Для каждого нового обзора скачивается обложка в public/media/reviews/<id>.webp.

Запуск из корня репозитория: python3 scripts/sync-reviews.py
Печатает добавленные обзоры; код выхода 0 и пустой вывод — новых нет.
"""
import html
import io
import json
import re
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "src" / "data" / "media.ts"
THUMBS = ROOT / "public" / "media" / "reviews"
RUTUBE_AUTHOR = 24527172  # RIKANV на RuTube
YOUTUBE_CHANNEL = "UCyczyy-Fp-BNoejpCWuGU7A"  # youtube.com/@RikaNV
SKIP = re.compile(r"новост|эфир|трансляц|розыгрыш", re.I)
# Модель в названии -> (линейка, товар). Порядок важен: сначала более точные шаблоны.
MODELS = [
    (r"kaban\s*650\s*(lrf\s*)?pro", "kaban", "kaban-650-lrf-pro"),
    (r"kaban\s*650", "kaban", "kaban-650-lrf"),
    (r"kaban\s*350", "kaban", "kaban-350-lrf"),
    (r"kaban\s*335", "kaban", "kaban-335-lrf"),
    (r"kaban", "kaban", None),
    (r"moskit\s*650", "moskit", "moskit-650-lrf"),
    (r"moskit\s*335", "moskit", "moskit-335-lrf"),
    (r"moskit", "moskit", None),
    (r"dovod\s*pro\s*1275", "dovod-pro", "dovod-pro-1275-lrf"),
    (r"dovod\s*pro\s*660", "dovod-pro", "dovod-pro-660-lrf"),
    (r"dovod\s*pro", "dovod-pro", None),
    (r"sinica", "sinica", "sinica-630"),
    (r"snegir\s*1280", "snegir", "snegir-1280"),
    (r"snegir\s*640", "snegir", "snegir-640"),
    (r"snegir", "snegir", None),
    (r"(strekoza|brf)[\s-]*4000|brf\s*4000", "strekoza", "strekoza-brf-4000"),
    (r"(strekoza|brf)[\s-]*2000|brf\s*2000", "strekoza", "strekoza-brf-2000"),
    (r"strekoza|brf", "strekoza", None),
]


def get(url, binary=False):
    # curl ходит через прокси окружения так же, как браузер; urllib получает 403 от CDN картинок.
    out = subprocess.run(["curl", "-sL", "-m", "60", "--retry", "3", "-A", "Mozilla/5.0", url], capture_output=True, check=True).stdout
    return out if binary else out.decode("utf-8", "ignore")


def norm(title):
    return re.sub(r"[^a-zа-я0-9]+", " ", title.lower().replace("ё", "е")).strip()


def model_of(title):
    for pattern, line, product in MODELS:
        if re.search(pattern, title, re.I):
            return line, product
    return None, None


def main():
    source = MEDIA.read_text(encoding="utf-8")
    known = set(re.findall(r"(?:youtube|rutube): '([\w-]+)'", source))

    feed = get(f"https://www.youtube.com/feeds/videos.xml?channel_id={YOUTUBE_CHANNEL}")
    youtube = {}
    for entry in re.findall(r"<entry>(.*?)</entry>", feed, re.S):
        if "/shorts/" in entry:
            continue
        vid = re.search(r"<yt:videoId>(.*?)<", entry).group(1)
        youtube[norm(html.unescape(re.search(r"<title>(.*?)</title>", entry).group(1)))] = (vid, html.unescape(re.search(r"<title>(.*?)</title>", entry).group(1)))

    added = []
    for page in (1, 2):
        data = json.loads(get(f"https://rutube.ru/api/video/person/{RUTUBE_AUTHOR}/?page={page}"))
        for video in data["results"]:
            title, rid = video["title"], video["id"]
            if rid in known or (video.get("duration") or 0) < 240 or SKIP.search(title):
                continue
            line, product = model_of(title)
            if not line:
                continue
            match = youtube.get(norm(title))
            if not match or match[0] in known:
                continue  # без YouTube-версии обложку и запасной плеер не взять — ждём, пока появится в RSS
            vid, yt_title = match
            image = get(f"https://i.ytimg.com/vi/{vid}/maxresdefault.jpg", binary=True)
            if len(image) < 5000:
                image = get(f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg", binary=True)
            Image.open(io.BytesIO(image)).convert("RGB").resize((960, 540), Image.LANCZOS).save(THUMBS / f"{vid}.webp", "WEBP", quality=80, method=6)
            fields = [f"youtube: '{vid}'", f"title: {json.dumps(yt_title, ensure_ascii=False)}", "author: 'RikaNV'", f"line: '{line}'"]
            if product:
                fields.append(f"product: '{product}'")
            fields += [f"rutube: '{rid}'", f"date: '{video['publication_ts'][:10]}'"]
            added.append("  { " + ", ".join(fields) + " },\n")
            known.update({vid, rid})
            print(f"{video['publication_ts'][:10]} {yt_title} — youtube {vid}, rutube {rid}, {line}/{product or '-'}")
        if not data.get("has_next"):
            break

    if added:
        anchor = "export const reviews: Review[] = [\n"
        MEDIA.write_text(source.replace(anchor, anchor + "".join(added), 1), encoding="utf-8")


if __name__ == "__main__":
    main()
