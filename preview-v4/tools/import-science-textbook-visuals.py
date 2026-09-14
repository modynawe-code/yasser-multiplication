#!/usr/bin/env python3
import hashlib
import io
import json
import math
import os
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF
import requests
from PIL import Image

BOOK_URL = "https://www.wajibati.net/wp-content/uploads/2025/08/kj-alum6f1_1_n7u8nrhvd4.pdf"
OUT_DIR = Path("preview-v4/assets/science/yasser/book")
MANIFEST_PATH = Path("preview-v4/src/modules/yasser/science/science-book-visuals.generated.js")

TARGETS = {
    "organization-levels": ["مستويات التنظيم", "تنظيم المخلوقات الحية", "خلية نسيج عضو جهاز"],
    "cell-comparison": ["الخلية النباتية والخلية الحيوانية", "الخلية النباتية", "الخلية الحيوانية"],
    "plant-cell-parts": ["أجزاء الخلية النباتية", "الخلية النباتية"],
    "animal-cell-parts": ["أجزاء الخلية الحيوانية", "الخلية الحيوانية"],
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
    "water-cell-components": ["الماء", "مكونات خلايا الإنسان"],
    "heart": ["القلب", "عضو"],
}

ALIASES = {
    "organization-levels": "مستويات التنظيم كما في كتاب العلوم",
    "cell-comparison": "صورة الخلية النباتية والخلية الحيوانية من الكتاب",
    "plant-cell-parts": "الخلية النباتية من الكتاب",
    "animal-cell-parts": "الخلية الحيوانية من الكتاب",
    "cell-wall-membrane": "الجدار الخلوي والغشاء البلازمي من الكتاب",
    "chloroplast-closeup": "البلاستيدات الخضراء من الكتاب",
    "mitochondria-closeup": "الميتوكندريا من الكتاب",
    "nucleus-closeup": "النواة من الكتاب",
    "vacuole-plant": "الفجوة في الخلية النباتية من الكتاب",
    "diffusion-gradient": "الانتشار من الكتاب",
    "osmosis-membrane": "الخاصية الأسموزية من الكتاب",
    "active-transport-energy": "النقل النشط من الكتاب",
    "passive-transport": "النقل السلبي من الكتاب",
    "photosynthesis-flow": "البناء الضوئي من الكتاب",
    "respiration-flow": "التنفس الخلوي من الكتاب",
    "tissues": "الأنسجة من الكتاب",
    "water-cell-components": "مكونات الخلية والماء من الكتاب",
    "heart": "القلب ضمن مستويات التنظيم من الكتاب",
}

ARABIC_DIACRITICS = re.compile(r"[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]")


def normalize(text: str) -> str:
    text = ARABIC_DIACRITICS.sub("", text or "")
    text = text.replace("ـ", "").replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    text = text.replace("ة", "ه").replace("ى", "ي")
    return re.sub(r"\s+", " ", text).strip()


def download_book() -> bytes:
    headers = {"User-Agent": "Mozilla/5.0 (compatible; FamilyLearningAssetImporter/1.0)"}
    response = requests.get(BOOK_URL, timeout=90, headers=headers)
    response.raise_for_status()
    data = response.content
    if len(data) < 1_000_000 or not data.startswith(b"%PDF"):
        raise RuntimeError(f"Unexpected textbook payload: {len(data)} bytes")
    return data


def center_distance(a: fitz.Rect, b: fitz.Rect, page: fitz.Rect) -> float:
    ax, ay = (a.x0 + a.x1) / 2, (a.y0 + a.y1) / 2
    bx, by = (b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2
    diag = math.hypot(page.width, page.height) or 1
    return math.hypot(ax - bx, ay - by) / diag


def page_keyword_rects(page, keywords):
    rects = []
    for keyword in keywords:
        try:
            rects.extend(page.search_for(keyword))
        except Exception:
            pass
    return rects


def candidate_pages(doc, keywords):
    normalized_keywords = [normalize(k) for k in keywords]
    hits = []
    for index, page in enumerate(doc):
        text = normalize(page.get_text("text"))
        score = sum(1 for k in normalized_keywords if k and k in text)
        if score:
            hits.append((index, score, text[:500]))
    return sorted(hits, key=lambda item: (-item[1], item[0]))


def page_images(doc, page_index, keyword_rects):
    page = doc[page_index]
    seen = set()
    results = []
    for image_info in page.get_images(full=True):
        xref = image_info[0]
        if xref in seen:
            continue
        seen.add(xref)
        width = int(image_info[2] or 0)
        height = int(image_info[3] or 0)
        if width < 180 or height < 120:
            continue
        try:
            rects = page.get_image_rects(xref)
        except Exception:
            rects = []
        if not rects:
            continue
        for rect in rects:
            area_ratio = (rect.width * rect.height) / max(page.rect.width * page.rect.height, 1)
            if area_ratio < 0.012:
                continue
            proximity = 0.55
            if keyword_rects:
                proximity = min(center_distance(rect, key_rect, page.rect) for key_rect in keyword_rects)
            pixel_bonus = min((width * height) / 1_000_000, 1.5) * 0.18
            score = area_ratio * 4.5 + pixel_bonus + (1.0 - proximity) * 0.9
            results.append({
                "page_index": page_index,
                "xref": xref,
                "rect": rect,
                "width": width,
                "height": height,
                "score": score,
                "area_ratio": area_ratio,
            })
    return results


def choose_image(doc, keywords, used):
    page_hits = candidate_pages(doc, keywords)
    scored = []
    for page_index, text_score, _ in page_hits[:10]:
        page = doc[page_index]
        keyword_rects = page_keyword_rects(page, keywords)
        for item in page_images(doc, page_index, keyword_rects):
            key = (item["page_index"], item["xref"])
            uniqueness_penalty = 0.45 if key in used else 0
            item = dict(item)
            item["score"] += min(text_score, 3) * 0.22 - uniqueness_penalty
            scored.append(item)
    if not scored:
        return None
    scored.sort(key=lambda item: item["score"], reverse=True)
    return scored[0]


def save_webp(doc, selected, path: Path):
    extracted = doc.extract_image(selected["xref"])
    raw = extracted["image"]
    image = Image.open(io.BytesIO(raw))
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "transparency" in image.info else "RGB")
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", quality=96, method=6)
    return image.size, hashlib.sha256(path.read_bytes()).hexdigest()


def js_escape(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def write_manifest(records):
    lines = [
        "// Generated from the Saudi Grade 6 science textbook. Do not hand-edit.",
        f"export const YASSER_SCIENCE_BOOK_SOURCE=Object.freeze({{label:'كتاب العلوم سادس ابتدائي ف1',kind:'textbook-exact',authority:'textbook',url:{js_escape(BOOK_URL)}}});",
        "export const YASSER_SCIENCE_BOOK_VISUAL_ASSETS=Object.freeze({",
    ]
    for item in records:
        lines.append(
            f"  {js_escape(item['id'])}:Object.freeze({{id:{js_escape(item['id'])},src:{js_escape(item['src'])},alt:{js_escape(item['alt'])},source:Object.freeze({{...YASSER_SCIENCE_BOOK_SOURCE,page:{item['page']},xref:{item['xref']},sha256:{js_escape(item['sha256'])}}})}}),"
        )
    lines.append("});")
    lines.append("")
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text("\n".join(lines), encoding="utf-8")


def main():
    pdf_bytes = download_book()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    if doc.page_count < 100:
        raise RuntimeError(f"Unexpected textbook page count: {doc.page_count}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    used = set()
    records = []
    missing = []

    for asset_id, keywords in TARGETS.items():
        selected = choose_image(doc, keywords, used)
        if not selected:
            missing.append(asset_id)
            print(f"MISS {asset_id}: no suitable textbook image")
            continue
        used.add((selected["page_index"], selected["xref"]))
        output_path = OUT_DIR / f"{asset_id}.webp"
        size, sha256 = save_webp(doc, selected, output_path)
        record = {
            "id": asset_id,
            "src": f"assets/science/yasser/book/{asset_id}.webp",
            "alt": ALIASES[asset_id],
            "page": selected["page_index"] + 1,
            "xref": selected["xref"],
            "sha256": sha256,
            "width": size[0],
            "height": size[1],
        }
        records.append(record)
        print(f"OK {asset_id}: page={record['page']} xref={record['xref']} size={size[0]}x{size[1]} score={selected['score']:.3f}")

    if len(records) < 12:
        raise RuntimeError(f"Only {len(records)} textbook visuals extracted; refusing to replace chapter visuals. Missing: {missing}")

    write_manifest(records)
    metadata = {
        "source": BOOK_URL,
        "pdf_sha256": hashlib.sha256(pdf_bytes).hexdigest(),
        "page_count": doc.page_count,
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
