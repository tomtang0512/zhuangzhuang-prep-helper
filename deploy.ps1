# 壮壮肉铺备料助手 - 一键部署脚本
# 用法：改完 src/prep_data.json 后，在项目目录执行  .\deploy.ps1
# 脚本会自动提交并推送到 GitHub，之后 GitHub Actions 会自动上线

$ErrorActionPreference = "Stop"

# 本机 git 完整路径（mingit）
$git = "C:\Users\李一多\Downloads\mingit\cmd\git.exe"

# 项目目录
$repo = "C:\Users\李一多\Downloads\zhuangzhuang-prep-helper"

# 检查 git 是否存在
if (-not (Test-Path $git)) {
    Write-Host "找不到 git，请检查路径：$git" -ForegroundColor Red
    exit 1
}

# 配置 credential helper，让 git 读取 Windows 凭据管理器里已保存的 GitHub 登录
& $git -C $repo config credential.helper wincred | Out-Null

# 检查是否有改动
$status = & $git -C $repo status --porcelain
if (-not $status) {
    Write-Host "没有需要提交的改动。" -ForegroundColor Yellow
    exit 0
}

# 暂存、提交、推送
& $git -C $repo add -A
$msg = "更新备料数据 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
& $git -C $repo commit -m $msg

Write-Host "正在推送到 GitHub..." -ForegroundColor Cyan
& $git -C $repo push origin master

Write-Host ""
Write-Host "部署已触发！GitHub Actions 会自动构建，约 1-2 分钟后生效。" -ForegroundColor Green
Write-Host "线上地址：https://tomtang0512.github.io/zhuangzhuang-prep-helper/"
