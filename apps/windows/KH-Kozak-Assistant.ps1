# KH么Kozak Assistant for Windows PowerShell 5.1
# Start it manually; while running, it listens for the Ukrainian wake word "Козак".
# Uses Windows Speech Recognition. Recognition language must be installed in Windows.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech
$recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$culture = [System.Globalization.CultureInfo]::GetCultureInfo("uk-UA")
$installed = [System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers() | Where-Object { $_.Culture.Name -eq "uk-UA" } | Select-Object -First 1
if (-not $installed) {
  Write-Host "Не знайдено мовний пакет розпізнавання української мови Windows." -ForegroundColor Yellow
  Write-Host "Установи українську мову/мовлення в Параметри Windows > Час і мова > Мова та регіон."
  Write-Host "Після встановлення запусти скрипт ще раз."
  exit 1
}
$recognizer = New-Object -TypeName System.Speech.Recognition.SpeechRecognitionEngine -ArgumentList $installed
$recognizer.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
$recognizer.SetInputToDefaultAudioDevice()
$armed = $false
Write-Host "KH么Kozak працює. Скажи «Козак», потім команду. Ctrl+C — вихід." -ForegroundColor Cyan
function Invoke-KHCommand([string]$Text) {
  $t = $Text.ToLowerInvariant().Trim()
  if ($t -match 'ютуб|youtube') { Start-Process "https://www.youtube.com"; return "Відкриваю YouTube" }
  if ($t -match 'гугл|google|пошук') { Start-Process "https://www.google.com"; return "Відкриваю Google" }
  if ($t -match 'телеграм|telegram') { Start-Process "https://t.me/tt_KH_Kozak"; return "Відкриваю Telegram" }
  if ($t -match 'тікток|tiktok|тік ток') { Start-Process "https://www.tiktok.com/@khkozak4"; return "Відкриваю профіль TikTok @khkozak4" }
  if ($t -match 'пабг|pubg') { Start-Process "https://play.google.com/store/apps/details?id=com.tencent.ig"; return "Відкриваю сторінку PUBG Mobile" }
  if ($t -match 'калькулятор') { Start-Process "calc.exe"; return "Відкриваю калькулятор" }
  if ($t -match 'блокнот|нотатки') { Start-Process "notepad.exe"; return "Відкриваю блокнот" }
  if ($t -match 'провідник|файли') { Start-Process "explorer.exe"; return "Відкриваю Провідник" }
  if ($t -match 'налаштування') { Start-Process "ms-settings:"; return "Відкриваю налаштування Windows" }
  if ($t -match 'браузер|інтернет') { Start-Process "https://www.google.com"; return "Відкриваю браузер" }
  return "Не знаю такої команди. Спробуй YouTube, Google, Telegram, калькулятор, блокнот або Провідник."
}
$recognizer.add_SpeechRecognized({
  param($sender, $eventArgs)
  $heard = $eventArgs.Result.Text
  Write-Host ("Почув: " + $heard) -ForegroundColor Gray
  if ($heard -match '(?i)\bкозак(е|о)?\b') {
    $command = ($heard -replace '(?i)\bкозак(е|о)?\b','').Trim(' ', ',', '.', '!', '?')
    if (-not $command) { $script:armed = $true; Write-Host "Так, слухаю команду…" -ForegroundColor Green; return }
    $script:armed = $false
    $answer = Invoke-KHCommand $command
    Write-Host ("KH: " + $answer) -ForegroundColor Green
    try { $voice = New-Object System.Speech.Synthesis.SpeechSynthesizer; $voice.SpeakAsync($answer) | Out-Null } catch {}
    return
  }
  if ($script:armed) {
    $script:armed = $false
    $answer = Invoke-KHCommand $heard
    Write-Host ("KH: " + $answer) -ForegroundColor Green
    try { $voice = New-Object System.Speech.Synthesis.SpeechSynthesizer; $voice.SpeakAsync($answer) | Out-Null } catch {}
  }
})
$recognizer.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
while ($true) { Start-Sleep -Seconds 1 }
