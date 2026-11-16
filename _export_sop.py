import json
import pathlib
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

root = pathlib.Path(r"C:\Users\李一多\Downloads\zhuangzhuang-prep-helper")
data = json.loads((root / "src/sop_data.json").read_text(encoding="utf-8"))

wb = Workbook()

HEAD_FILL = PatternFill("solid", start_color="1F2937")
HEAD_FONT = Font(bold=True, color="FFFFFF", size=11)
RED_FILL = PatternFill("solid", start_color="FEE2E2")
THIN = Side(style="thin", color="E5E7EB")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
WRAP = Alignment(wrap_text=True, vertical="top")


def style_sheet(ws, widths, header_row=1):
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    for cell in ws[header_row]:
        cell.fill = HEAD_FILL
        cell.font = HEAD_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.freeze_panes = ws.cell(row=header_row + 1, column=1)


# 1. 明细（每个步骤一行，与页面数据一一对应）
ws = wb.active
ws.title = "明细"
ws.append(["环节", "分组", "品名", "步骤序号", "步骤内容", "重点", "规格", "该项备注"])
for section in data["sections"]:
    for group in section["groups"]:
        for item in group["items"]:
            steps = item.get("steps", [])
            if not steps:
                ws.append([section["name"], group["name"], item["name"], "", "", "", "", item.get("note", "")])
                continue
            for i, step in enumerate(steps, start=1):
                if isinstance(step, str):
                    ws.append([section["name"], group["name"], item["name"], i, step, "", "", item.get("note", "") if i == 1 else ""])
                else:
                    ws.append([
                        section["name"], group["name"], item["name"], i, step.get("t", ""),
                        "★" if step.get("key") else "",
                        "规格" if step.get("spec") else "",
                        item.get("note", "") if i == 1 else "",
                    ])
style_sheet(ws, [10, 22, 28, 9, 60, 8, 8, 40])
for row in ws.iter_rows(min_row=2):
    for cell in row:
        cell.alignment = WRAP
        cell.border = BORDER

# 2. 品名总表
ws2 = wb.create_sheet("品名总表")
ws2.append(["环节", "分组", "品名", "步骤数", "关键步骤数", "该项备注"])
for section in data["sections"]:
    for group in section["groups"]:
        for item in group["items"]:
            steps = item.get("steps", [])
            key_n = sum(1 for s in steps if isinstance(s, dict) and s.get("key"))
            ws2.append([section["name"], group["name"], item["name"], len(steps), key_n, item.get("note", "")])
style_sheet(ws2, [10, 22, 28, 9, 12, 40])
for row in ws2.iter_rows(min_row=2):
    for cell in row:
        cell.alignment = WRAP
        cell.border = BORDER

# 3. 红线（全店大前提，7 条）
ws3 = wb.create_sheet("红线")
ws3.append(["序号", "红线内容", "要点/细则", "警示", "涉及环节（参考）"])
for line in data["redlines"]:
    detail = []
    for p in line.get("points", []):
        detail.append(p)
    for l in line.get("limits", []):
        detail.append(f"{l['item']}：{l['limit']}")
    ws3.append([line["no"], line["title"], "\n".join(detail), line.get("warn", ""), "全程"])
style_sheet(ws3, [7, 34, 56, 26, 12])
for row in ws3.iter_rows(min_row=2):
    for cell in row:
        cell.alignment = WRAP
        cell.border = BORDER
        cell.fill = RED_FILL

# 4. 换算表
ws4 = wb.create_sheet("换算表")
conv = data.get("conversions", {})
ws4.append(["类别", "生重(g)", "熟重(g)", "照烧汁(g)", "其他说明"])
meta_ratios = conv.get("meta", {})
for k, v in meta_ratios.items():
    if k == "title":
        continue
    ws4.append(["生制熟比例", "", "", "", f"{k}: {v}"])
for cat in ["鸡腿肉", "鸡胸肉", "牛肉片", "照烧鸡腿", "虾仁"]:
    for row in conv.get(cat, []):
        ws4.append([cat, row[0], row[1], row[2] if len(row) > 2 else "", ""])
style_sheet(ws4, [14, 12, 14, 12, 40])
for row in ws4.iter_rows(min_row=2):
    for cell in row:
        cell.alignment = WRAP
        cell.border = BORDER

# 5. 说明
ws5 = wb.create_sheet("说明")
notes = [
    ("项目", "说明"),
    ("导出时间", "2026-11-13"),
    ("数据来源", "zhuangzhuang-prep-helper/src/sop_data.json（页面唯一数据源）"),
    ("重点标记", "「重点」列 ★ = SOP 中标红的关键步骤，维持品质稳定，不可省略或改动"),
    ("规格标记", "「规格」列 = 规格类要求，页面以蓝色小标签展示"),
    ("品名备注", "「该项备注」列 = 该品名的附加说明，页面显示为品名下黄色备注条；只在第一步显示"),
    ("红线", "共 7 条，为全店大前提；「要点/细则」可多行；改完发我即可回填"),
    ("食安自查", "不在本表内：食安自查属于打分器（badcase-tracker/audit.html），数据在 audit_data.json"),
    ("换算表", "生制熟比例/照烧汁换算等，按行修改即可"),
    ("回填方式", "改完把 Excel 发我，我按相同结构转回 sop_data.json；不要改列名和 sheet 名"),
]
for row in notes:
    ws5.append(list(row))
style_sheet(ws5, [16, 80])
for row in ws5.iter_rows(min_row=2):
    for cell in row:
        cell.alignment = WRAP
        cell.border = BORDER

out = pathlib.Path(r"C:\Users\李一多\Desktop\周会\肉铺\履约和配送\壮壮SOP数据_2026-11-13.xlsx")
out.parent.mkdir(parents=True, exist_ok=True)
wb.save(out)
print("saved", out)
print("sheets:", wb.sheetnames)
print("明细行数:", ws.max_row - 1, "品名数:", ws2.max_row - 1, "红线数:", ws3.max_row - 1)
