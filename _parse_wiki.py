import json
import pathlib
import openpyxl

SRC = pathlib.Path(r"C:\Users\李一多\Desktop\周会\肉铺\履约和配送\壮壮SOP数据_2026-11-13.xlsx")
OUT = pathlib.Path(r"C:\Users\李一多\Downloads\zhuangzhuang-prep-helper\src\wiki_data.json")

SHEETS = [
    ("营养成分-easy碗", "纤体Easy碗"),
    ("营养成分-pro碗", "蛋白Pro碗"),
    ("营养成分-鲜蔬锅", "鲜蔬锅"),
    ("营养成分-卷饼", "卷饼"),
]


def num(value):
    if value is None or value == "":
        return None
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    return round(f, 2)


def clean(value):
    if value is None:
        return ""
    return str(value).strip()


def parse_sheet(ws, category):
    dishes = []
    current_dish = None
    current_variant = None
    packaging_ref = []
    for row in ws.iter_rows(min_row=3, values_only=True):
        sku = clean(row[1] if len(row) > 1 else None)
        spec = clean(row[2] if len(row) > 2 else None)
        module = clean(row[3] if len(row) > 3 else None)
        if module == "整体":
            # 新 SKU 开局；同名 SKU 的加肉款等新规格作为新变体
            if sku:
                current_dish = {
                    "category": category,
                    "sku": sku,
                    "selling": clean(row[11] if len(row) > 11 else None),
                    "variants": [],
                }
                dishes.append(current_dish)
            if current_dish is None:
                continue
            current_variant = {
                "spec": spec,
                "selling": clean(row[11] if len(row) > 11 else None),
                "total": {
                    "grams": num(row[4] if len(row) > 4 else None),
                    "kcal": num(row[5] if len(row) > 5 else None),
                    "protein": num(row[6] if len(row) > 6 else None),
                    "fat": num(row[7] if len(row) > 7 else None),
                    "carbs": num(row[8] if len(row) > 8 else None),
                    "cost": num(row[9] if len(row) > 9 else None),
                },
                "items": [],
                "packaging": [],
            }
            current_dish["variants"].append(current_variant)
            continue
        # 包装物料：第一行是“物料”标签+价格，下一行才是具体包材清单
        if module == "物料":
            current_variant["packaging"].append({
                "name": "",
                "price": num(row[9] if len(row) > 9 else None),
            })
            continue
        if current_variant["packaging"] and current_variant["packaging"][-1]["name"] == "":
            current_variant["packaging"][-1]["name"] = module
            continue
        if current_variant is None or not module:
            continue
        item = {
            "module": module,
            "name": module,
            "grams": num(row[4] if len(row) > 4 else None),
            "gramsRaw": clean(row[4] if len(row) > 4 else None),
            "kcal": num(row[5] if len(row) > 5 else None),
            "protein": num(row[6] if len(row) > 6 else None),
            "fat": num(row[7] if len(row) > 7 else None),
            "carbs": num(row[8] if len(row) > 8 else None),
            "cost": num(row[9] if len(row) > 9 else None),
            "note": clean(row[10] if len(row) > 10 else None),
        }
        current_variant["items"].append(item)
        # easy碗 右侧的包材清单（只出现一次，作为品类参考，不挂到菜品）
        pkg_name = clean(row[18] if len(row) > 18 else None)
        if pkg_name and not any(p["name"] == pkg_name for p in packaging_ref):
            packaging_ref.append({
                "name": pkg_name,
                "price": num(row[19] if len(row) > 19 else None),
            })
    return dishes, packaging_ref


wb = openpyxl.load_workbook(SRC, data_only=True)
dishes = []
packaging_ref = {}
for sheet_name, category in SHEETS:
    parsed, ref = parse_sheet(wb[sheet_name], category)
    dishes.extend(parsed)
    if ref:
        packaging_ref[category] = ref

data = {
    "meta": {
        "title": "菜品构成与营养成分",
        "source": "壮壮SOP数据_2026-11-13.xlsx（营养成分-* / Sheet4）",
        "updated": "2026-11-13",
        "count": len(dishes),
        "packaging": packaging_ref,
    },
    "dishes": dishes,
}

OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print("dishes:", len(dishes))
print("variants:", sum(len(d["variants"]) for d in dishes))
print("packaging_ref:", {k: len(v) for k, v in packaging_ref.items()})
for d in dishes[:4]:
    print(d["category"], "|", d["sku"][:26], "|", " / ".join(v["spec"][:14] for v in d["variants"]))
print("...")
for d in dishes[-2:]:
    print(d["category"], "|", d["sku"][:30], "|", " / ".join(v["spec"][:14] for v in d["variants"]))
