#!/usr/bin/env python3
import difflib
import hashlib
import io
import json
import math
import re
import sys
from pathlib import Path

import cv2
import numpy as np
import pymupdf
import pytesseract
import requests
from PIL import Image
from pytesseract import Output

BOOK_URL = "https://www.wajibati.net/wp-content/uploads/2025/08/kj-alum6f1_1_n7u8nrhvd4.pdf"
OUT_DIR = Path("preview-v4/assets/science/yasser/book")
MANIFEST_PATH = Path("preview-v4/src/modules/yasser/science/science-book-visuals.generated.js")
SCAN_START = 8
SCAN_END = 72
RENDER_SCALE = 2.15

TARGETS = {
    "organization-levels": ["مستويات التنظيم", "المخلوقات الحية تنظيم", "خلية نسيج عضو جهاز"],
    "cell-comparison": ["الخلية النباتية والخلية الحيوانية", "الخلية النباتية", "الخلية الحيوانية"],
    "plant-cell-parts": ["الخلية النباتية", "أجزاء الخلية النباتية"],
    "animal-cell-parts": ["الخلية الحيوانية", "أجزاء الخلية الحيوانية"],
    "cell-wall-membrane": ["الجدار الخلوي", "الغشاء البلازمي"],
    "chloroplast-closeup": ["البلاستيدات الخضراء", "البلاستيدة الخضراء"],
    "mitochondria-closeup": ["الميتوكندريا"],
    "nucleus-closeup": ["النواة"],
    "vacuole-plant": ["الفجوات", "الفجوة"],
    "diffusion-gradient": ["الانتشار"],
    "osmosis-membrane": ["الخاصية الأسموزية", "الأسموزية"],
    "active-transport-energy": ["النقل النشط"],
    "passive-transport": ["النقل السلبي"],
    "photosynthesis-flow": ["البناء الضوئي"],
    "respiration-flow": ["التنفس الخلوي"],
    "tissues": ["الأنسجة", "النسيج"],
    "water-cell-components": ["مكونات خلايا الإنسان", "الماء"],
    "heart": ["القلب", "العضو"],
}

ALIASES = {
    "organization-levels": "مستويات التنظيم كما تظهر في كتاب العلوم",
    "cell-comparison": "الخلية النباتية والخلية الحيوانية من كتاب العلوم",
    "plant-cell-parts": "الخلية النباتية من كتاب العلوم",
    "animal-cell-parts": "الخلية الحيوانية من كتاب العلوم",
    "cell-wall-membrane": "الجدار الخلوي والغشاء البلازمي من كتاب العلوم",
    "chloroplast-closeup": "البلاستيدات الخضراء من كتاب العلوم",
    "mitochondria-closeup": "الميتوكندريا من كتاب العلوم",
    "nucleus-closeup": "النواة من كتاب العلوم",
    "vacuole-plant": "الفجوة في الخلية النباتية من كتاب العلوم",
    "diffusion-gradient": "الانتشار من كتاب العلوم",
    "osmosis-membrane": "الخاصية الأسموزية من كتاب العلوم",
    "active-transport-energy": "النقل النشط من كتاب العلوم",
    "passive-transport": "النقل السلبي من كتاب العلوم",
    "photosynthesis-flow": "البناء الضوئي من كتاب العلوم",
    "respiration-flow": "التنفس الخلوي من كتاب العلوم",
    "tissues": "الأنسجة من كتاب العلوم",
    "water-cell-components": "مكونات الخلية والماء من كتاب العلوم",
    "heart": "القلب ضمن مستويات التنظيم من كتاب العلوم",
}

ARABIC_DIACRITICS = re.compile(r"[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]")


def normalize(text: str) -> str:
    text = ARABIC_DIACRITICS.sub("", text or "")
    text = text.replace("ـ", "").replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    text = text.replace("ة", "ه").replace("ى", "ي")
    text = re.sub(r"[^\u0600-\u06ffA-Za-z0-9%]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def download_book() -> bytes:
    headers = {"User-Agent": "Mozilla/5.0 (compatible; FamilyLearningAssetImporter/1.0)"}
    response = requests.get(BOOK_URL, timeout=90, headers=headers)
    response.raise_for_status()
    data = response.content
    if len(data) < 1_000_000 or not data.startswith(b"%PDF"):
        raise RuntimeError(f"Unexpected textbook payload: {len(data)} bytes")
    return data


def render_page(doc, page_index: int) -> Image.Image:
    page = doc[page_index]
    matrix = pymupdf.Matrix(RENDER_SCALE, RENDER_SCALE)
    pix = page.get_pixmap(matrix=matrix, alpha=False)
    return Image.frombytes("RGB", [pix.width, pix.height], pix.samples)


def token_similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    if len(a) <= 3 or len(b) <= 3:
        return 0.0
    return difflib.SequenceMatcher(None, a, b).ratio()


def ocr_page(image: Image.Image):
    data = pytesseract.image_to_data(image, lang="ara+eng", config="--psm 6", output_type=Output.DICT)
    tokens = []
    count = len(data.get("text", []))
    for i in range(count):
        raw = data["text"][i]
        text = normalize(raw)
        if not text:
            continue
        try:
            conf = float(data["conf"][i])
        except Exception:
            conf = 0
        if conf < 18:
            continue
        tokens.append({
            "text": text,
            "left": int(data["left"][i]),
            "top": int(data["top"][i]),
            "width": int(data["width"][i]),
            "height": int(data["height"][i]),
            "conf": conf,
        })
    return tokens


def phrase_score(tokens, phrase):
    words = [normalize(w) for w in normalize(phrase).split() if normalize(w)]
    if not words or not tokens:
        return 0.0, None
    matched = []
    sims = []
    for word in words:
        best = max(tokens, key=lambda token: token_similarity(word, token["text"]))
        sim = token_similarity(word, best["text"])
        sims.append(sim)
        if sim >= 0.68:
            matched.append(best)
    score = sum(sims) / len(sims)
    if not matched:
        return score, None
    center_y = sum(item["top"] + item["height"] / 2 for item in matched) / len(matched)
    return score, center_y


def find_page_hits(ocr_cache, phrases):
    hits = []
    for page_index, payload in ocr_cache.items():
        best_score = 0.0
        best_y = None
        best_phrase = None
        for phrase in phrases:
            score, y = phrase_score(payload["tokens"], phrase)
            if score > best_score:
                best_score, best_y, best_phrase = score, y, phrase
        if best_score >= 0.62:
            hits.append({"page_index": page_index, "score": best_score, "target_y": best_y, "phrase": best_phrase})
    return sorted(hits, key=lambda item: (-item["score"], item["page_index"]))


def merge_boxes(boxes, gap=30):
    boxes = [list(map(int, box)) for box in boxes]
    changed = True
    while changed:
        changed = False
        output = []
        while boxes:
            x, y, w, h = boxes.pop(0)
            x2, y2 = x + w, y + h
            merged = False
            for idx, (ox, oy, ow, oh) in enumerate(boxes):
                ox2, oy2 = ox + ow, oy + oh
                if not (x2 + gap < ox or ox2 + gap < x or y2 + gap < oy or oy2 + gap < y):
                    nx, ny = min(x, ox), min(y, oy)
                    nx2, ny2 = max(x2, ox2), max(y2, oy2)
                    boxes[idx] = [nx, ny, nx2 - nx, ny2 - ny]
                    merged = True
                    changed = True
                    break
            if not merged:
                output.append([x, y, w, h])
        boxes = output
    return boxes


def visual_regions(image: Image.Image):
    rgb = np.asarray(image)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    sat = hsv[:, :, 1]
    val = hsv[:, :, 2]
    color_mask = ((sat > 36) & (val > 35)).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (19, 19))
    mask = cv2.morphologyEx(color_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_RECT, (13, 13)), iterations=1)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    h, w = rgb.shape[:2]
    boxes = []
    for contour in contours:
        x, y, bw, bh = cv2.boundingRect(contour)
        area = bw * bh
        if bw < w * 0.10 or bh < h * 0.055 or area < w * h * 0.004:
            continue
        if bw > w * 0.96 and bh > h * 0.92:
            continue
        boxes.append([x, y, bw, bh])
    return merge_boxes(boxes, gap=max(20, int(w * 0.018)))


def region_score(box, image_size, target_y, used_key):
    x, y, w, h = box
    iw, ih = image_size
    area_ratio = (w * h) / max(iw * ih, 1)
    center_y = y + h / 2
    if target_y is None:
        proximity = 0.45
    else:
        proximity = abs(center_y - target_y) / max(ih, 1)
    edge_penalty = 0.25 if y < ih * 0.08 or y + h > ih * 0.94 else 0
    duplicate_penalty = 0.42 if used_key else 0
    return area_ratio * 3.2 + (1.0 - min(proximity, 1.0)) * 1.2 - edge_penalty - duplicate_penalty


def choose_region(page_hits, ocr_cache, used):
    candidates = []
    for hit in page_hits[:8]:
        page_index = hit["page_index"]
        payload = ocr_cache[page_index]
        image = payload["image"]
        boxes = visual_regions(image)
        for box in boxes:
            rounded = tuple(int(v / 25) for v in box)
            key = (page_index, rounded)
            score = region_score(box, image.size, hit["target_y"], key in used) + hit["score"] * 0.55
            candidates.append({
                "page_index": page_index,
                "box": box,
                "key": key,
                "score": score,
                "phrase": hit["phrase"],
            })
    if not candidates:
        return None
    candidates.sort(key=lambda item: item["score"], reverse=True)
    return candidates[0]


def crop_visual(image: Image.Image, box, padding=28):
    x, y, w, h = box
    left = max(0, x - padding)
    top = max(0, y - padding)
    right = min(image.width, x + w + padding)
    bottom = min(image.height, y + h + padding)
    return image.crop((left, top, right, bottom))


def js_escape(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def write_manifest(records):
    lines = [
        "// Generated from the Saudi Grade 6 science textbook. Do not hand-edit.",
        f"export const YASSER_SCIENCE_BOOK_SOURCE=Object.freeze({{label:'كتاب العلوم سادس ابتدائي ف1',kind:'textbook-exact',authority:'textbook',url:{js_escape(BOOK_URL)}}});",
        "export const YASSER_SCIENCE_BOOK_VISUAL_ASSETS=Object.freeze({",
    ]
    for item in records:
        bbox = item["bbox"]
        lines.append(
            f"  {js_escape(item['id'])}:Object.freeze({{id:{js_escape(item['id'])},src:{js_escape(item['src'])},alt:{js_escape(item['alt'])},source:Object.freeze({{...YASSER_SCIENCE_BOOK_SOURCE,page:{item['page']},bbox:Object.freeze([{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}]),sha256:{js_escape(item['sha256'])}}})}}),"
        )
    lines.append("});")
    lines.append("")
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text("\n".join(lines), encoding="utf-8")


def main():
    pdf_bytes = download_book()
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    if doc.page_count < 100:
        raise RuntimeError(f"Unexpected textbook page count: {doc.page_count}")

    ocr_cache = {}
    end = min(SCAN_END, doc.page_count)
    for page_index in range(SCAN_START, end):
        image = render_page(doc, page_index)
        tokens = ocr_page(image)
        ocr_cache[page_index] = {"image": image, "tokens": tokens}
        if page_index % 8 == 0:
            print(f"OCR page {page_index + 1}/{end}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    used = set()
    records = []
    missing = []

    for asset_id, phrases in TARGETS.items():
        hits = find_page_hits(ocr_cache, phrases)
        selected = choose_region(hits, ocr_cache, used)
        if not selected:
            missing.append(asset_id)
            print(f"MISS {asset_id}: OCR/visual region not found")
            continue
        used.add(selected["key"])
        page_image = ocr_cache[selected["page_index"]]["image"]
        crop = crop_visual(page_image, selected["box"])
        output_path = OUT_DIR / f"{asset_id}.webp"
        crop.save(output_path, "WEBP", quality=96, method=6)
        sha256 = hashlib.sha256(output_path.read_bytes()).hexdigest()
        record = {
            "id": asset_id,
            "src": f"assets/science/yasser/book/{asset_id}.webp",
            "alt": ALIASES[asset_id],
            "page": selected["page_index"] + 1,
            "bbox": selected["box"],
            "sha256": sha256,
            "width": crop.width,
            "height": crop.height,
            "matched_phrase": selected["phrase"],
        }
        records.append(record)
        print(f"OK {asset_id}: page={record['page']} crop={crop.width}x{crop.height} phrase={selected['phrase']} score={selected['score']:.3f}")

    if len(records) < 12:
        raise RuntimeError(f"Only {len(records)} textbook visuals extracted; refusing to replace chapter visuals. Missing: {missing}")

    write_manifest(records)
    metadata = {
        "source": BOOK_URL,
        "pdf_sha256": hashlib.sha256(pdf_bytes).hexdigest(),
        "page_count": doc.page_count,
        "scan_range": [SCAN_START + 1, end],
        "assets": records,
        "missing": missing,
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Extracted {len(records)} exact textbook visuals; missing {len(missing)}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise
