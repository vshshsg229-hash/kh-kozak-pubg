# KH么Kozak Assistant for Windows PowerShell 5.1
# Ukrainian Windows speech recognition must be installed.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech
$installed = [System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers() | Where-Object { $_.Culture.Name -eq "uk-UA" } | Select-Object -First 1
if (-not $installed) {
  Write-Host "Не знайдено розпізнавання української мови Windows." -ForegroundColor Yellow
  Write-Host "Установи українську мову та мовлення: Параметри > Час і мова > Мова та регіон."
  exit 1
}
$recognizer = New-Object -TypeName System.Speech.Recognition.SpeechRecognitionEngine -ArgumentList $installed
$recognizer.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
$recognizer.SetInputToDefaultAudioDevice()
$script:armed = $false
$script:pendingPowerAction = $null
Write-Host "KH么Kozak працює. Скажи «Козак», потім команду. Ctrl+C — вихід." -ForegroundColor Cyan
Write-Host "Вимкнення/перезапуск потребують окремого підтвердження." -ForegroundColor Yellow

function Invoke-KHCommand([string]$Text) {
  $t = $Text.ToLowerInvariant().Trim()
  if ($script:pendingPowerAction) {
    if (($script:pendingPowerAction -eq "shutdown") -and ($t -match '^(підтверджую вимкнення|так вимкни)$')) {
      $script:pendingPowerAction = $null
      Start-Process "$env:SystemRoot\System32\shutdown.exe" -ArgumentList '/s /t 30 /c "KH Assistant: підтверджене вимкнення"'
      return "Підтверджено. Комп'ютер вимкнеться через 30 секунд. Скажи «Козак, скасувати вимкнення», щоб скасувати."
    }
    if (($script:pendingPowerAction -eq "restart") -and ($t -match '^(підтверджую перезапуск|так перезавантаж)$')) {
      $script:pendingPowerAction = $null
      Start-Process "$env:SystemRoot\System32\shutdown.exe" -ArgumentList '/r /t 30 /c "KH Assistant: підтверджений перезапуск"'
      return "Підтверджено. Комп'ютер перезавантажиться через 30 секунд. Скажи «Козак, скасувати вимкнення», щоб скасувати."
    }
    if ($t -match '^(ні|скасувати|скасуй|відміна)$') {
      $script:pendingPowerAction = $null
      return "Добре, дію скасовано."
    }
  }
  if ($t -match 'скасуй вимкнення|скасувати вимкнення|скасуй перезавантаження|скасувати перезапуск') {
    $script:pendingPowerAction = $null
    try { Start-Process "$env:SystemRoot\System32\shutdown.exe" -ArgumentList "/a" -ErrorAction Stop; return "Якщо таймер був активний, його скасовано." }
    catch { return "Не вдалося скасувати таймер. Можливо, запланованої дії немає." }
  }
  if ($t -match 'вимкни комп.?ютер|вимкни пк|вимкни пристрій|вимкни віндовс|вимкнути комп.?ютер|вимкнути пк') {
    $script:pendingPowerAction = "shutdown"
    return "Ти справді хочеш вимкнути комп'ютер? Скажи «підтверджую вимкнення» або «скасувати»."
  }
  if ($t -match 'перезавантаж комп.?ютер|перезапусти комп.?ютер|перезавантаж пк|перезапусти пк|перезавантаж систему') {
    $script:pendingPowerAction = "restart"
    return "Ти справді хочеш перезавантажити комп'ютер? Скажи «підтверджую перезапуск» або «скасувати»."
  }
  if ($t -match 'режим сну|приспати комп.?ютер|відправ у сон') {
    try {
      Add-Type -MemberDefinition '[System.Runtime.InteropServices.DllImport("PowrProf.dll", SetLastError=true)] public static extern bool SetSuspendState(bool hibernate, bool forceCritical, bool disableWakeEvent);' -Name KHPower -Namespace KHAssistant -ErrorAction SilentlyContinue
      [KHAssistant.KHPower]::SetSuspendState($false, $false, $false) | Out-Null
      return "Надіслано команду переходу в режим сну. Пробудження залежить від Windows та обладнання."
    } catch { return "Не вдалося перейти в режим сну. Перевір налаштування живлення Windows." }
  }
  if ($t -match '^(знайди|пошукай|погугли|пошук)(\s+в\s+(інтернеті|гуглі|google))?\s+(.+)$') {
    $query = $Matches[4].Trim()
    Start-Process ("https://www.google.com/search?q=" + [System.Uri]::EscapeDataString($query))
    return ("Шукаю в інтернеті: " + $query)
  }
  if ($t -match 'що ти вмієш|що ти можеш|які твої можливості|які команди|допомога|що можна робити') {
    return "Я можу відкривати програми та ігри, які є в меню Пуск, запускати калькулятор, камеру, Провідник, налаштування, браузер і сайти, шукати в інтернеті, керувати режимом сну та після окремого підтвердження вимикати або перезапускати Windows. Я не можу обійти дозволи, гарантувати запуск програм, яких немає на комп'ютері, керувати будь-якою грою всередині неї або слухати команди, коли ПК повністю вимкнений."
  }
  if ($t -match 'що ти не можеш|чого ти не можеш|твої обмеження|що недоступно') {
    return "Я не можу працювати, коли комп'ютер повністю вимкнений, обходити системні дозволи, встановлювати програми без підтвердження або гарантувати керування функціями сторонніх ігор. Для голосу потрібні мікрофон і встановлене українське розпізнавання мовлення Windows. Якщо програма не встановлена або не відображається в меню Пуск, я можу не знайти її."
  }
  if ($t -match 'календар|подію') { Start-Process "ms-calendar:"; return "Відкриваю календар, якщо він установлений." }
  if ($t -match 'калькулятор') { Start-Process "calc.exe"; return "Відкриваю калькулятор." }
  if ($t -match 'камера|фотоапарат') { Start-Process "microsoft.windows.camera:"; return "Відкриваю камеру Windows." }
  if ($t -match 'галерея|фотографії|зображення') { Start-Process "explorer.exe" -ArgumentList ([Environment]::GetFolderPath("MyPictures")); return "Відкриваю папку зображень." }
  if ($t -match 'карти|мапи|навігація') { Start-Process "https://maps.google.com"; return "Відкриваю карти." }
  if ($t -match 'телефон|дзвінки|phone link') { Start-Process "ms-settings:mobile-devices"; return "Відкриваю налаштування мобільних пристроїв." }
  if ($t -match 'ліхтарик|фонарик') { return "На більшості ПК немає керованого системного ліхтарика; це залежить від обладнання та драйверів." }
  if ($t -match 'будильник|годинник|таймер') { Start-Process "ms-clock:"; return "Відкриваю годинник, якщо застосунок установлений." }
  if ($t -match 'контакти') { Start-Process "ms-people:"; return "Відкриваю контакти, якщо застосунок підтримується." }
  if ($t -match 'повідомлення|смс') { Start-Process "ms-settings:messaging"; return "Відкриваю доступні налаштування повідомлень." }
  if ($t -match 'завантаження') { Start-Process "explorer.exe" -ArgumentList (Join-Path ([Environment]::GetFolderPath("UserProfile")) "Downloads"); return "Відкриваю Завантаження." }
  if ($t -match 'файли|провідник|папку') { Start-Process "explorer.exe"; return "Відкриваю Провідник." }
  if ($t -match 'wi.?fi|вай.?фай|мережа') { Start-Process "ms-settings:network"; return "Відкриваю налаштування мережі." }
  if ($t -match 'bluetooth|блютуз') { Start-Process "ms-settings:bluetooth"; return "Відкриваю налаштування Bluetooth." }
  if ($t -match 'гучність|звук') { Start-Process "sndvol.exe"; return "Відкриваю мікшер гучності." }
  if ($t -match 'екран|дисплей') { Start-Process "ms-settings:display"; return "Відкриваю налаштування екрана." }
  if ($t -match 'батарея|акумулятор|живлення') { Start-Process "ms-settings:powersleep"; return "Відкриваю параметри живлення." }
  if ($t -match 'налаштування') { Start-Process "ms-settings:"; return "Відкриваю налаштування Windows." }
  if ($t -match 'ютуб|youtube') { Start-Process "https://www.youtube.com"; return "Відкриваю YouTube." }
  if ($t -match 'гугл|google') { Start-Process "https://www.google.com"; return "Відкриваю Google." }
  if ($t -match 'телеграм|telegram') { Start-Process "https://t.me/tt_KH_Kozak"; return "Відкриваю Telegram." }
  if ($t -match 'тікток|tiktok|тік ток') { Start-Process "https://www.tiktok.com/@khkozak4"; return "Відкриваю TikTok @khkozak4." }
  if ($t -match 'пабг|pubg') { Start-Process "https://play.google.com/store/apps/details?id=com.tencent.ig"; return "Відкриваю сторінку PUBG Mobile." }
  if ($t -match 'браузер|відкрий інтернет') { Start-Process "https://www.google.com"; return "Відкриваю браузер." }
  if ($t -match '^(відкрий|запусти|відкрити|запустити|зайди в|зайди у)\\s+(.+)
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
) {
    $requested = $Matches[2].Trim()
    $startApps = Get-StartApps
    $app = $startApps | Where-Object { $_.Name -eq $requested } | Select-Object -First 1
    if (-not $app -and $requested.Length -ge 3) {
      $app = $startApps | Where-Object { $_.Name -like ("*" + $requested + "*") } | Select-Object -First 1
    }
    if ($app) {
      try {
        Start-Process "explorer.exe" -ArgumentList ("shell:AppsFolder\\" + $app.AppID)
        return ("Відкриваю " + $app.Name + ".")
      } catch { return ("Знайшов " + $app.Name + ", але Windows не вдалося його запустити.") }
    }
    return ("Не знайшов програму або гру «" + $requested + "» у меню Пуск. Перевір назву або встанови її.")
  }
  return "Не знаю цієї команди. Спробуй календар, калькулятор, камеру, галерею, карти, файли, звук, мережу або «знайди ...»."
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
