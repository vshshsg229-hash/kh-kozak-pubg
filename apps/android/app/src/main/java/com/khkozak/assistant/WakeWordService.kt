package com.khkozak.assistant

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.pm.PackageManager
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.content.Intent
import android.net.Uri
import android.provider.AlarmClock
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.widget.Toast
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

class WakeWordService : Service(), RecognitionListener {
    private val channelId = "kh_assistant_voice"
    private val handler = Handler(Looper.getMainLooper())
    private var recognizer: SpeechRecognizer? = null
    private var textToSpeech: TextToSpeech? = null
    private var ttsReady = false
    private var pendingSpeech: String? = null
    private var armed = false
    private var running = false

    override fun onCreate() {
        super.onCreate()
        createChannel()
        textToSpeech = TextToSpeech(this) { status ->
            if (status == TextToSpeech.SUCCESS) {
                textToSpeech?.language = Locale("uk", "UA")
                ttsReady = true
                pendingSpeech?.let { message ->
                    textToSpeech?.speak(message, TextToSpeech.QUEUE_FLUSH, null, "kh_assistant_reply")
                    pendingSpeech = null
                }
            }
        }
        val openApp = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val stopService = Intent(this, WakeWordService::class.java).setAction("STOP")
        val stopAction = PendingIntent.getService(this, 1, stopService, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val notification: Notification = if (Build.VERSION.SDK_INT >= 26) {
            Notification.Builder(this, channelId)
                .setContentTitle("KH Assistant слухає")
                .setContentText("Скажи «Козак», щоб дати команду. Натисни «Зупинити», щоб вимкнути мікрофон.")
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setContentIntent(openApp)
                .addAction(Notification.Action.Builder(null, "Зупинити слухання", stopAction).build())
                .setOngoing(true)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this).setContentTitle("KH Assistant").setContentText("Слухаю слово «Козак»").setSmallIcon(android.R.drawable.ic_btn_speak_now).setOngoing(true).build()
        }
        startForeground(1701, notification)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "STOP") { stopSelf(); return START_NOT_STICKY }
        if (intent?.action == "TEXT_COMMAND") {
            val typedCommand = intent.getStringExtra("command").orEmpty().trim()
            if (typedCommand.isNotBlank()) {
                recognizer?.cancel()
                runCommand(typedCommand)
                val isStopCommand = typedCommand.contains("вимкни слухання", ignoreCase = true) ||
                    typedCommand.contains("зупини слухання", ignoreCase = true) ||
                    typedCommand.contains("вимкни помічника", ignoreCase = true)
                if (!isStopCommand) {
                    if (!running) startVoiceRecognition()
                    else handler.postDelayed({ startRecognition() }, 700)
                }
            }
            return START_STICKY
        }
        startVoiceRecognition()
        return START_STICKY
    }

    private fun startVoiceRecognition() {
        if (running) return
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            Toast.makeText(this, "На пристрої немає служби розпізнавання мовлення.", Toast.LENGTH_LONG).show()
            stopSelf()
            return
        }
        running = true
        recognizer = SpeechRecognizer.createSpeechRecognizer(this).also { it.setRecognitionListener(this) }
        startRecognition()
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(NotificationChannel(channelId, "KH Assistant — голос", NotificationManager.IMPORTANCE_LOW))
        }
    }

    private fun startRecognition() {
        if (!running) return
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "uk-UA")
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
        }
        try { recognizer?.startListening(intent) } catch (_: Exception) { handler.postDelayed({ startRecognition() }, 1200) }
    }

    override fun onResults(results: Bundle?) {
        val heard = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()?.lowercase(Locale.forLanguageTag("uk-UA")).orEmpty()
        if (heard.isNotBlank()) handlePhrase(heard)
        handler.postDelayed({ startRecognition() }, 450)
    }

    private fun handlePhrase(heard: String) {
        val containsWake = Regex("\\bкозак(е|о)?\\b", RegexOption.IGNORE_CASE).containsMatchIn(heard)
        if (containsWake) {
            val command = heard.replace(Regex("\\bкозак(е|о)?\\b", RegexOption.IGNORE_CASE), "").trim(' ', ',', '.', '!', '?')
            if (command.isBlank()) { armed = true; return }
            armed = false
            runCommand(command)
        } else if (armed) {
            armed = false
            runCommand(heard)
        }
    }

    private fun runCommand(raw: String) {
        val command = raw.lowercase(Locale.forLanguageTag("uk-UA")).trim()
        val searchMatch = Regex("^(знайди|пошукай|погугли|пошук)\\s+(.+)$").find(command)
        if (searchMatch != null) {
            val query = searchMatch.groupValues[2].trim()
            openExternalUrl("https://www.google.com/search?q=" + Uri.encode(query), "Шукаю в інтернеті: $query")
            return
        }

        when {
            "ліхтарик" in command || "фонарик" in command -> {
                setFlashlight(!(command.contains("вимк") || command.contains("виключ") || command.contains("off")))
                return
            }
            "галерея" in command || "фотографії" in command || "зображення" in command -> {
                launchSystemIntent(Intent(Intent.ACTION_GET_CONTENT).setType("image/*").addCategory(Intent.CATEGORY_OPENABLE), "вибір фотографії")
                return
            }
            "карти" in command || "мапи" in command || "навігац" in command -> {
                openExternalUrl("https://maps.google.com", "відкриваю карти")
                return
            }
            "дзвони" in command || "зателефонуй" in command || "набір номера" in command -> {
                launchSystemIntent(Intent(Intent.ACTION_DIAL), "набір номера")
                return
            }
            "календар" in command || "подію" in command -> {
                launchAppCategory(Intent.CATEGORY_APP_CALENDAR, "календар")
                return
            }
            "будильник" in command || "таймер" in command || "годинник" in command -> {
                launchSystemIntent(Intent(AlarmClock.ACTION_SHOW_ALARMS), "годинник")
                return
            }
            "калькулятор" in command || "порахуй" in command || "обчисли" in command -> {
                launchCalculator()
                return
            }
            "камера" in command || "фото" in command -> {
                launchSystemIntent(Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE), "камеру")
                return
            }
            "контакт" in command || "телефон" in command -> {
                launchAppCategory(Intent.CATEGORY_APP_CONTACTS, "контакти")
                return
            }
            "повідомлен" in command || "смс" in command -> {
                launchSystemIntent(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_APP_MESSAGING), "повідомлення")
                return
            }
            "файли" in command || "провідник" in command || "завантаження" in command -> {
                launchSystemIntent(Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE), "вибір файлів")
                return
            }
            "wi-fi" in command || "вайфай" in command || "вай фай" in command || "блютуз" in command || "bluetooth" in command -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    launchSystemIntent(Intent(android.provider.Settings.Panel.ACTION_INTERNET_CONNECTIVITY), "панель мережі")
                } else {
                    launchSystemIntent(Intent(android.provider.Settings.ACTION_WIRELESS_SETTINGS), "налаштування мережі")
                }
                return
            }
            "батаре" in command || "акумулятор" in command -> {
                launchSystemIntent(Intent(android.provider.Settings.ACTION_BATTERY_SAVER_SETTINGS), "налаштування батареї")
                return
            }
            "гучність" in command || "звук" in command -> {
                launchSystemIntent(Intent(android.provider.Settings.ACTION_SOUND_SETTINGS), "налаштування звуку")
                return
            }
            "екран" in command || "дисплей" in command -> {
                launchSystemIntent(Intent(android.provider.Settings.ACTION_DISPLAY_SETTINGS), "налаштування екрана")
                return
            }
            "налаштуван" in command -> {
                launchSystemIntent(Intent(android.provider.Settings.ACTION_SETTINGS), "налаштування")
                return
            }
            "браузер" in command || "інтернет" in command -> {
                openExternalUrl("https://www.google.com", "відкриваю браузер")
                return
            }
            "вимкни слухання" in command || "зупини слухання" in command || "вимкни помічника" in command -> {
                stopSelf()
                return
            }
            "вимкни пристрій" in command || "вимкни телефон" in command || "перезавантаж пристрій" in command || "перезавантаж телефон" in command -> {
                Toast.makeText(this, "Android не дозволяє звичайному додатку вимикати або перезавантажувати пристрій напряму. Скористайся фізичною кнопкою живлення.", Toast.LENGTH_LONG).show()
                return
            }
        }

        if (command.matches(Regex(".*\\b(що ти вмієш|що ти можеш|які твої можливості|допомога|які команди|що можна робити)\\b.*"))) {
            speakOrShow("Я можу відкривати встановлені програми та ігри, запускати камеру, калькулятор, карти, галерею, годинник і налаштування; керувати ліхтариком; відкривати сайти та шукати в інтернеті. Скажи: «Козак, відкрий YouTube» або «Козак, запусти Minecraft». Якщо програми немає, спробую знайти її в Play Маркеті. Я не можу обійти системні дозволи, встановлювати програми без підтвердження, гарантовано керувати будь-якою грою всередині неї чи вимикати телефон напряму.")
            return
        }
        if (command.matches(Regex(".*\\b(чого ти не можеш|що ти не можеш|твої обмеження|що недоступно)\\b.*"))) {
            speakOrShow("Я не можу виконувати дії, заборонені Android, обходити блокування чи дозволи, або керувати всіма функціями сторонніх програм. Для мікрофона, камери та ліхтарика потрібні дозволи; деякі програми мають бути встановлені. Я скажу, якщо дію не вдалося виконати.")
            return
        }
        if (command.matches(Regex("^(відкрий|запусти|відкрити|запустити|зайди в|зайди у)\\s+.+$"))) {
            val appPhrase = command.replace(Regex("^(відкрий|запусти|відкрити|запустити|зайди в|зайди у)\\s+"), "")
                .replace(Regex("^(гру|застосунок|додаток|програму)\\s+"), "")
                .trim()
            if (appPhrase.isNotBlank() && launchInstalledAppByName(appPhrase)) return
        }

        val target = when {
            "youtube" in command || "ютуб" in command -> "https://www.youtube.com"
            "гугл" in command || "google" in command -> "https://www.google.com"
            "телеграм" in command || "telegram" in command -> "https://t.me/tt_KH_Kozak"
            "тікток" in command || "tiktok" in command || "тік ток" in command -> "https://www.tiktok.com/@khkozak4"
            "pubg" in command || "пабг" in command -> {
                if (launchPackage("com.tencent.ig", "PUBG Mobile")) null
                else "https://play.google.com/store/apps/details?id=com.tencent.ig"
            }
            "музик" in command -> "https://vshshsg229-hash.github.io/kh-kozak-pubg/music.html"
            "мінігр" in command || "ігри" in command -> "https://vshshsg229-hash.github.io/kh-kozak-pubg/minigames.html"
            else -> null
        }
        if (target != null) {
            openExternalUrl(target, "відкриваю посилання")
        } else {
            askAiAssistant(raw)
        }
    }

    private fun askAiAssistant(question: String) {
        val endpoint = getSharedPreferences("kh_assistant_ai", MODE_PRIVATE).getString("endpoint", "").orEmpty().trim()
        if (endpoint.isBlank()) {
            speakOrShow("Я можу виконувати команди та озвучувати відповіді. Щоб вільно спілкуватися як AI-чат, додай HTTPS-адресу захищеного AI-сервера в розділі «Розумні відповіді AI».")
            return
        }
        Thread {
            var connection: HttpURLConnection? = null
            try {
                connection = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 12000
                    readTimeout = 25000
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json; charset=utf-8")
                }
                val messages = JSONArray().put(JSONObject().put("role", "user").put("content", question.take(3000)))
                val body = JSONObject()
                    .put("messages", messages)
                    .put("language", "uk")
                    .put("page", "android-app")
                connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
                val code = connection.responseCode
                val stream = if (code in 200..299) connection.inputStream else connection.errorStream
                val responseText = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
                if (code !in 200..299) throw IllegalStateException("AI server returned HTTP $code")
                val reply = JSONObject(responseText).optString("reply").trim()
                if (reply.isBlank()) throw IllegalStateException("Empty AI reply")
                handler.post { speakOrShow(reply.take(4500)) }
            } catch (_: Exception) {
                handler.post { speakOrShow("Не вдалося отримати AI-відповідь. Перевір адресу сервера, інтернет і налаштування Cloudflare Worker.") }
            } finally {
                connection?.disconnect()
            }
        }.start()
    }

    private fun openExternalUrl(url: String, message: String) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            speakOrShow(message)
        } catch (_: Exception) {
            speakOrShow("Не вдалося відкрити посилання. Перевір інтернет або браузер.")
        }
    }

    private fun setFlashlight(enabled: Boolean) {
        if (checkSelfPermission(android.Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            try {
                val request = Intent(this, MainActivity::class.java).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                    putExtra("request_camera_for_torch", true)
                    putExtra("torch_command", if (enabled) "увімкни ліхтарик" else "вимкни ліхтарик")
                }
                startActivity(request)
                speakOrShow("Відкрив KH Assistant — дозволь камеру, щоб керувати ліхтариком.")
            } catch (_: Exception) {
                speakOrShow("Відкрий KH Assistant і дозволь камеру, щоб керувати ліхтариком.")
            }
            return
        }
        try {
            val manager = getSystemService(CameraManager::class.java)
            val cameraId = manager.cameraIdList.firstOrNull { id ->
                manager.getCameraCharacteristics(id).get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
            }
            if (cameraId == null) {
                speakOrShow("На пристрої немає доступного ліхтарика.")
                return
            }
            manager.setTorchMode(cameraId, enabled)
            speakOrShow(if (enabled) "Ліхтарик увімкнено." else "Ліхтарик вимкнено.")
        } catch (_: Exception) {
            speakOrShow("Не вдалося перемкнути ліхтарик. Перевір дозвіл камери або закрий застосунок, який використовує камеру.")
        }
    }

    private fun launchSystemIntent(intent: Intent, label: String) {
        try {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (intent.resolveActivity(packageManager) == null) {
                speakOrShow("Не знайшов застосунок для дії: $label.")
                return
            }
            startActivity(intent)
            speakOrShow("Відкриваю $label.")
        } catch (_: Exception) {
            speakOrShow("Не вдалося відкрити: $label.")
        }
    }

    private fun speakOrShow(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        if (ttsReady) {
            textToSpeech?.speak(message, TextToSpeech.QUEUE_FLUSH, null, "kh_assistant_reply")
        } else {
            pendingSpeech = message
        }
    }

    private fun launchPackage(packageName: String, label: String): Boolean {
        return try {
            val appIntent = packageManager.getLaunchIntentForPackage(packageName) ?: return false
            appIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(appIntent)
            speakOrShow("Відкриваю $label.")
            true
        } catch (_: Exception) {
            false
        }
    }

    private fun launchInstalledAppByName(requestedName: String): Boolean {
        return try {
            val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
            val apps = packageManager.queryIntentActivities(launcherIntent, 0)
            val normalizedRequest = requestedName.lowercase(Locale.ROOT)
                .replace(Regex("[^\\p{L}\\p{N} ]"), " ")
                .replace(Regex("\\s+"), " ").trim()
            val match = apps.firstOrNull { info ->
                val label = info.loadLabel(packageManager).toString().lowercase(Locale.ROOT)
                    .replace(Regex("[^\\p{L}\\p{N} ]"), " ")
                    .replace(Regex("\\s+"), " ").trim()
                label == normalizedRequest || (normalizedRequest.length >= 3 && label.contains(normalizedRequest))
            }
            if (match != null) {
                val intent = packageManager.getLaunchIntentForPackage(match.activityInfo.packageName)
                if (intent != null) {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    startActivity(intent)
                    speakOrShow("Відкриваю " + match.loadLabel(packageManager) + ".")
                    return true
                }
            }
            openExternalUrl("https://play.google.com/store/search?q=" + Uri.encode(requestedName) + "&c=apps", "Не знайшов установлену програму «" + requestedName + "». Шукаю її в Play Маркеті.")
            true
        } catch (_: Exception) {
            speakOrShow("Не вдалося знайти або відкрити «" + requestedName + "».")
            true
        }
    }

    private fun launchCalculator() {
        // Android calculator package names differ between manufacturers.
        val packages = listOf(
            "com.google.android.calculator",
            "com.android.calculator2",
            "com.transsion.calculator",
            "com.transsion.calculator2",
            "com.miui.calculator",
            "com.sec.android.app.popupcalculator",
            "com.coloros.calculator",
            "com.oplus.calculator",
            "com.vivo.calculator"
        )
        for (packageName in packages) {
            try {
                val appIntent = packageManager.getLaunchIntentForPackage(packageName)
                if (appIntent != null) {
                    appIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    startActivity(appIntent)
                    speakOrShow("Відкриваю калькулятор.")
                    return
                }
            } catch (_: Exception) {
                // Try another known calculator package.
            }
        }
        try {
            val categoryIntent = Intent(Intent.ACTION_MAIN)
                .addCategory(Intent.CATEGORY_APP_CALCULATOR)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (categoryIntent.resolveActivity(packageManager) != null) {
                startActivity(categoryIntent)
                speakOrShow("Відкриваю калькулятор.")
                return
            }
        } catch (_: Exception) {
            // Use Play Store search if no calculator app can be launched.
        }
        openExternalUrl("https://play.google.com/store/search?q=calculator&c=apps", "Не знайшов калькулятор на телефоні. Відкриваю пошук у Play Маркеті.")
    }

    private fun launchAppCategory(category: String, label: String) {
        try {
            val intent = Intent(Intent.ACTION_MAIN).addCategory(category).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (intent.resolveActivity(packageManager) == null) {
                speakOrShow("Не знайшов застосунок: $label.")
                return
            }
            startActivity(intent)
            speakOrShow("Відкриваю $label.")
        } catch (_: Exception) {
            speakOrShow("Не знайшов застосунок: $label.")
        }
    }

    override fun onReadyForSpeech(params: Bundle?) {}
    override fun onBeginningOfSpeech() {}
    override fun onRmsChanged(rmsdB: Float) {}
    override fun onBufferReceived(buffer: ByteArray?) {}
    override fun onEndOfSpeech() {}
    override fun onError(error: Int) {
        if (running) handler.postDelayed({ startRecognition() }, 900)
    }
    override fun onPartialResults(partialResults: Bundle?) {}
    override fun onEvent(eventType: Int, params: Bundle?) {}

    override fun onDestroy() {
        running = false
        handler.removeCallbacksAndMessages(null)
        recognizer?.destroy()
        recognizer = null
        textToSpeech?.stop()
        textToSpeech?.shutdown()
        textToSpeech = null
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }
    override fun onBind(intent: Intent?): IBinder? = null
}
