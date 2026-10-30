"""Обновляет цены и наличие в src/data/catalog.json.

Цена берётся с rikasale.ru, если товар там есть, иначе с rikanv.ru. Наличие — с rikanv.ru.
Запуск из корня репозитория: python3 scripts/update-prices.py
"""
import json
import re
import time
import urllib.request
from pathlib import Path

CATALOG = Path(__file__).resolve().parent.parent / "src" / "data" / "catalog.json"


def get(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    for attempt in range(4):
        try:
            return urllib.request.urlopen(request, timeout=60).read().decode("utf-8", "ignore")
        except OSError:
            if attempt == 3:
                raise
            time.sleep(2 * (attempt + 1))


def rikanv_offer(url):
    for raw in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', get(url), re.S):
        try:
            data = json.loads(raw)
        except ValueError:
            continue
        if isinstance(data, dict) and data.get("@type") == "Product":
            return data.get("offers") or {}
    return {}


def rikasale_price(url):
    page = get(url)
    for pattern in (r'itemprop="price"[^>]*content="([\d.]+)"', r'"price":\s*"?([\d.]+)', r'data-price="([\d.]+)"'):
        match = re.search(pattern, page)
        if match and float(match.group(1)) > 0:
            return int(float(match.group(1)))
    return None


catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
for product in catalog:
    offer = rikanv_offer(product["source"])
    price = (rikasale_price(product["rikasale"]) if product.get("rikasale") else None) or (int(offer["price"]) if offer.get("price") else None)
    availability = (offer.get("availability") or "").rsplit("/", 1)[-1] or None
    if (price, availability) != (product["price"], product["availability"]):
        print(f"{product['name']}: {product['price']} → {price}, {product['availability']} → {availability}")
    product["price"], product["availability"] = price, availability
CATALOG.write_text(json.dumps(catalog, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print("Готово. Проверьте изменения и отправьте их в GitHub — сайт пересоберётся сам.")
