# pokemon-trainer 설치 스크립트 (Windows PowerShell)
# 저장소를 받거나 최신으로 맞추고, Claude Code 설정(settings.json)에
# 모드 폴더와 피카츄 테마를 등록합니다. 기존 설정은 그대로 두고,
# 바꾸기 전 원본을 settings.json.bak 으로 백업합니다.

$ErrorActionPreference = 'Stop'
$Repo = 'https://github.com/qazwsx1121/Claude-Code-mods'
$Branch = 'claude/busy-cori-ujrvf6'

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw 'git이 설치되어 있지 않아요. https://git-scm.com 에서 설치한 뒤 다시 실행하세요.'
}

# 1. 저장소: 이 스크립트가 저장소 안에서 실행되면 그 폴더를, 아니면 홈 폴더 아래를 씁니다.
if ($PSScriptRoot -and (Test-Path (Join-Path $PSScriptRoot 'pokemon-trainer'))) {
  $Dir = $PSScriptRoot
} else {
  $Dir = Join-Path $env:USERPROFILE 'Claude-Code-mods'
}
if (Test-Path (Join-Path $Dir '.git')) {
  Write-Host "저장소 최신으로 맞추는 중: $Dir"
  git -C $Dir fetch origin $Branch
  git -C $Dir checkout $Branch
  git -C $Dir pull --ff-only origin $Branch
} else {
  Write-Host "저장소 받는 중: $Dir"
  git clone -b $Branch $Repo $Dir
}
$ModDir = (Join-Path $Dir 'pokemon-trainer') -replace '\\', '/'
if (-not (Test-Path (Join-Path $ModDir '.claude-plugin/plugin.json'))) {
  throw "모드 폴더를 찾지 못했어요: $ModDir"
}

# 2. 설정: settings.json 에 모드 경로와 테마를 넣습니다.
$SettingsDir = Join-Path $env:USERPROFILE '.claude'
$Settings = Join-Path $SettingsDir 'settings.json'
New-Item -ItemType Directory -Force $SettingsDir | Out-Null
$json = [pscustomobject]@{}
if (Test-Path $Settings) {
  Copy-Item $Settings "$Settings.bak" -Force
  $raw = [IO.File]::ReadAllText($Settings)
  if ($raw.Trim()) {
    try { $json = $raw | ConvertFrom-Json }
    catch { throw "settings.json 이 올바른 JSON이 아니에요. 고친 뒤 다시 실행하세요 (원본 백업: $Settings.bak)" }
  }
}
if (-not $json.PSObject.Properties['env']) {
  $json | Add-Member -NotePropertyName env -NotePropertyValue ([pscustomobject]@{})
}
$dirs = @(([string]$json.env.CLAUDE_CODE_PLUGIN_DIRS) -split ';' |
  Where-Object { $_ -and ($_ -notmatch 'pokemon-trainer') }) + $ModDir
$json.env | Add-Member -NotePropertyName CLAUDE_CODE_PLUGIN_DIRS -NotePropertyValue ($dirs -join ';') -Force
$json | Add-Member -NotePropertyName theme -NotePropertyValue 'custom:pokemon-trainer:pokemon' -Force
# BOM 없는 UTF-8 로 저장해야 Claude Code가 읽을 수 있습니다.
[IO.File]::WriteAllText($Settings, ($json | ConvertTo-Json -Depth 20), (New-Object Text.UTF8Encoding $false))

Write-Host ''
Write-Host '설치 완료! 새 터미널에서 claude 를 실행하세요.' -ForegroundColor Yellow
Write-Host "  모드 폴더: $ModDir"
Write-Host "  설정 파일: $Settings"
