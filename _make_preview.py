import pathlib

root = pathlib.Path(r"C:\Users\李一多\Downloads\zhuangzhuang-prep-helper")
js = (root / "dist-single/sop.js").read_text(encoding="utf-8")
css = (root / "dist-single/style.css").read_text(encoding="utf-8")

html = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<title>壮壮SOP速查 · 预览</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>">
<style>""" + css + """</style>
</head>
<body><div id="root"></div><script>""" + js + """</script></body>
</html>"""

out = pathlib.Path(r"C:\Users\李一多\Downloads\壮壮SOP速查_预览.html")
out.write_text(html, encoding="utf-8")
print(out.name, out.stat().st_size)
