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
import android.widget.Toast
import java.util.Locale

class WakeWordService : Service(), RecognitionListener {
    private val channelId = "kh_assistant_voice"
    private val handler = Handler(Looper.getMainLooper())
    private var recognizer: SpeechRecognizer? = null
    private var armed = false
    private var running = false

    override fun onCreate() {
        super.onCreate()
        createChannel()
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
        if (!running) {
            if (!SpeechRecognizer.isRecognitionAvailable(this)) {
                Toast.makeText(this, "На пристрої немає служби розпізнавання мовлення.", Toast.LENGTH_LONG).show()
                stopSelf()
                return START_NOT_STICKY
            }
            running = true
            recognizer = SpeechRecognizer.createSpeechRecognizer(this).also { it.setRecognitionListener(this) }
            startRecognition()
        }
        return START_STICKY
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
            "калькулятор" in command -> {
                launchAppCategory(Intent.CATEGORY_APP_CALCULATOR, "калькулятор")
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

        val target = when {
            "youtube" in command || "ютуб" in command -> "https://www.youtube.com"
            "гугл" in command || "google" in command -> "https://www.google.com"
            "телеграм" in command || "telegram" in command -> "https://t.me/tt_KH_Kozak"
            "тікток" in command || "tiktok" in command || "тік ток" in command -> "https://www.tiktok.com/@khkozak4"
            "pubg" in command || "пабг" in command -> "https://play.google.com/store/apps/details?id=com.tencent.ig"
            "музик" in command -> "https://vshshsg229-hash.github.io/kh-kozak-pubg/music.html"
            "мінігр" in command || "ігри" in command -> "https://vshshsg229-hash.github.io/kh-kozak-pubg/minigames.html"
            else -> null
        }
        if (target != null) {
            openExternalUrl(target, "відкриваю посилання")
        } else {
            Toast.makeText(this, "Не знаю цієї команди. Спробуй календар, будильник, калькулятор, камеру, ліхтарик, галерею, карти, дзвінки, контакти, файли або налаштування. Вимкнення пристрою напряму недоступне.", Toast.LENGTH_LONG).show()
        }
    }

    private fun openExternalUrl(url: String, message: String) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
        } catch (_: Exception) {
            Toast.makeText(this, "Не вдалося відкрити посилання. Перевір інтернет або браузер.", Toast.LENGTH_LONG).show()
        }
    }

    private fun setFlashlight(enabled: Boolean) {
        if (checkSelfPermission(android.Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(this, "Дозволь доступ до камери в налаштуваннях KH Assistant, щоб керувати ліхтариком.", Toast.LENGTH_LONG).show()
            return
        }
        try {
            val manager = getSystemService(CameraManager::class.java)
            val cameraId = manager.cameraIdList.firstOrNull { id ->
                manager.getCameraCharacteristics(id).get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
            }
            if (cameraId == null) {
                Toast.makeText(this, "На пристрої немає доступного ліхтарика.", Toast.LENGTH_LONG).show()
                return
            }
            manager.setTorchMode(cameraId, enabled)
            Toast.makeText(this, if (enabled) "Ліхтарик увімкнено." else "Ліхтарик вимкнено.", Toast.LENGTH_SHORT).show()
        } catch (_: Exception) {
            Toast.makeText(this, "Не вдалося перемкнути ліхтарик. Перевір дозвіл камери або закрий застосунок, який використовує камеру.", Toast.LENGTH_LONG).show()
        }
    }

    private fun launchSystemIntent(intent: Intent, label: String) {
        try {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (intent.resolveActivity(packageManager) == null) {
                Toast.makeText(this, "Не знайшов застосунок для дії: $label.", Toast.LENGTH_LONG).show()
                return
            }
            startActivity(intent)
            Toast.makeText(this, "Відкриваю $label.", Toast.LENGTH_SHORT).show()
        } catch (_: Exception) {
            Toast.makeText(this, "Не вдалося відкрити: $label.", Toast.LENGTH_LONG).show()
        }
    }

    private fun launchAppCategory(category: String, label: String) {
        try {
            val intent = Intent(Intent.ACTION_MAIN).addCategory(category).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
            Toast.makeText(this, "Відкриваю $label.", Toast.LENGTH_SHORT).show()
        } catch (_: Exception) {
            Toast.makeText(this, "Не знайшов застосунок: $label.", Toast.LENGTH_LONG).show()
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
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }
    override fun onBind(intent: Intent?): IBinder? = null
}
