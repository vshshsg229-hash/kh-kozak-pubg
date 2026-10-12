package com.khkozak.assistant

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.net.Uri
import android.os.Build
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
        val notification: Notification = if (Build.VERSION.SDK_INT >= 26) {
            Notification.Builder(this, channelId)
                .setContentTitle("KH Assistant слухає")
                .setContentText("Скажи «Козак», щоб дати команду. Натисни, щоб відкрити помічника.")
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setContentIntent(openApp)
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
        val command = raw.lowercase(Locale.forLanguageTag("uk-UA"))
        val target = when {
            "youtube" in command || "ютуб" in command -> "https://www.youtube.com"
            "гугл" in command || "google" in command || "пошук" in command -> "https://www.google.com"
            "телеграм" in command || "telegram" in command -> "https://t.me/tt_KH_Kozak"
            "тікток" in command || "tiktok" in command || "тік ток" in command -> "https://www.tiktok.com/@khkozak4"
            "pubg" in command || "пабг" in command -> "https://play.google.com/store/apps/details?id=com.tencent.ig"
            "музик" in command -> "https://vshshsg229-hash.github.io/kh-kozak-pubg/music.html"
            "мінігр" in command || "ігри" in command -> "https://vshshsg229-hash.github.io/kh-kozak-pubg/minigames.html"
            else -> null
        }
        if (target != null) {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(target)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            try { startActivity(intent) } catch (_: Exception) { }
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
