package com.khkozak.assistant

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.OpenableColumns
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast

class MainActivity : Activity() {
    private val requestCode = 1402
    private val filePickerRequestCode = 1403
    private lateinit var fileStatus: TextView
    private lateinit var commandInput: EditText
    private lateinit var statusText: TextView
    private lateinit var historyContainer: LinearLayout

    private val bg = Color.rgb(10, 12, 22)
    private val panel = Color.rgb(22, 26, 43)
    private val muted = Color.rgb(160, 170, 192)
    private val white = Color.rgb(246, 248, 255)
    private val lime = Color.rgb(255, 199, 55)
    private val purple = Color.rgb(143, 110, 255)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = bg
        window.navigationBarColor = bg
        window.decorView.systemUiVisibility = 0

        val page = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(bg)
        }
        val scroll = ScrollView(this).apply { isFillViewport = true }
        val content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(18), dp(20), dp(28))
        }
        scroll.addView(content)
        page.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))

        val top = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        val logo = TextView(this).apply {
            text = "K"
            textSize = 27f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setTextColor(bg)
            background = rounded(lime, 18)
            layoutParams = LinearLayout.LayoutParams(dp(54), dp(54))
        }
        val brand = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(12), 0, 0, 0)
        }
        brand.addView(text("KH么KOZAK", 18f, white, true))
        brand.addView(text("PERSONAL ASSISTANT", 10f, muted, true).apply { letterSpacing = 0.12f })
        top.addView(logo)
        top.addView(brand, LinearLayout.LayoutParams(0, -2, 1f))
        val livePill = text("● READY", 11f, lime, true).apply {
            background = rounded(Color.rgb(36, 49, 31), 30)
            setPadding(dp(12), dp(8), dp(12), dp(8))
        }
        top.addView(livePill)
        content.addView(top)
        addGap(content, 26)

        val hero = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded(panel, 24)
            setPadding(dp(20), dp(22), dp(20), dp(20))
        }
        hero.addView(text("Твій помічник.\nТвої правила.", 29f, white, true))
        addGap(hero, 8)
        hero.addView(text("Керуй голосом або просто напиши, що потрібно зробити.", 15f, muted, false))
        addGap(hero, 16)
        val statusRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        statusRow.addView(text("●", 12f, lime, true))
        statusText = text("  Голосове слухання не запущено", 12f, muted, false)
        statusRow.addView(statusText)
        hero.addView(statusRow)
        content.addView(hero)
        addGap(content, 12)
        val openHub = actionButton("🌐  Відкрити KH么Kozak Gaming Hub", Color.rgb(48, 38, 26), lime)
        openHub.setOnClickListener { openWebPage("https://vshshsg229-hash.github.io/kh-kozak-pubg/", "KH么Kozak Gaming Hub") }
        content.addView(openHub, LinearLayout.LayoutParams(-1, dp(50)))
        addGap(content, 20)

        content.addView(sectionTitle("НАПИШИ ПОМІЧНИКУ", "01"))
        addGap(content, 10)
        val chatPanel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded(panel, 22)
            setPadding(dp(14), dp(14), dp(14), dp(14))
        }
        commandInput = EditText(this).apply {
            hint = "Наприклад: відкрий калькулятор"
            textSize = 16f
            minLines = 2
            maxLines = 4
            setTextColor(white)
            setHintTextColor(muted)
            setPadding(dp(14), dp(12), dp(14), dp(12))
            gravity = Gravity.TOP or Gravity.START
            background = rounded(Color.rgb(12, 15, 28), 15)
            setSingleLine(false)
            imeOptions = android.view.inputmethod.EditorInfo.IME_ACTION_SEND
        }
        chatPanel.addView(commandInput, LinearLayout.LayoutParams(-1, dp(82)))
        commandInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == android.view.inputmethod.EditorInfo.IME_ACTION_SEND) {
                sendTypedCommand()
                true
            } else false
        }
        addGap(chatPanel, 10)
        val send = actionButton("➤   Надіслати команду", lime, bg)
        send.setOnClickListener { sendTypedCommand() }
        chatPanel.addView(send, LinearLayout.LayoutParams(-1, dp(52)))
        addGap(chatPanel, 8)
        chatPanel.addView(text("Працює з командами, які підтримує Android-помічник.", 12f, muted, false))
        content.addView(chatPanel)
        addGap(content, 20)

        content.addView(sectionTitle("ШВИДКІ КОМАНДИ", "02"))
        addGap(content, 10)
        val quickRows = listOf(
            listOf("🧮  Калькулятор", "▶  YouTube"),
            listOf("🎮  PUBG Mobile", "📷  Камера"),
            listOf("🔦  Ліхтарик", "🖼  Галерея"),
            listOf("⏰  Будильник", "⚙  Налаштування"),
            listOf("🌐  Знайди котиків", "❔  Що ти вмієш?")
        )
        quickRows.forEach { items ->
            val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            items.forEachIndexed { index, label ->
                val b = actionButton(label, Color.rgb(34, 39, 60), white)
                b.textSize = 13f
                b.setOnClickListener {
                    val command = when (label) {
                        "🧮  Калькулятор" -> "відкрий калькулятор"
                        "▶  YouTube" -> "відкрий YouTube"
                        "🎮  PUBG Mobile" -> "запусти PUBG Mobile"
                        "📷  Камера" -> "відкрий камеру"
                        "🔦  Ліхтарик" -> "увімкни ліхтарик"
                        "🖼  Галерея" -> "відкрий галерею"
                        "⏰  Будильник" -> "відкрий будильник"
                        "⚙  Налаштування" -> "відкрий налаштування"
                        "🌐  Знайди котиків" -> "знайди милих котиків"
                        else -> "що ти вмієш"
                    }
                    commandInput.setText(command)
                    sendTypedCommand()
                }
                row.addView(b, LinearLayout.LayoutParams(0, dp(48), 1f).apply {
                    if (index == 0) marginEnd = dp(8) else marginStart = dp(0)
                })
            }
            content.addView(row)
            addGap(content, 8)
        }
        addGap(content, 12)

        content.addView(sectionTitle("ОСТАННІ КОМАНДИ", "03"))
        addGap(content, 10)
        val historyPanel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded(panel, 20)
            setPadding(dp(12), dp(12), dp(12), dp(12))
        }
        historyContainer = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        historyPanel.addView(historyContainer)
        val clearHistory = actionButton("Очистити історію", Color.rgb(55, 35, 42), Color.rgb(255, 175, 185))
        clearHistory.setOnClickListener {
            getSharedPreferences("kh_assistant_history", MODE_PRIVATE).edit().remove("commands").apply()
            renderCommandHistory()
            Toast.makeText(this, "Історію команд очищено", Toast.LENGTH_SHORT).show()
        }
        addGap(historyPanel, 8)
        historyPanel.addView(clearHistory, LinearLayout.LayoutParams(-1, dp(44)))
        content.addView(historyPanel)
        renderCommandHistory()
        addGap(content, 20)

        content.addView(sectionTitle("KH么KOZAK — ШВИДКИЙ ДОСТУП", "04"))
        addGap(content, 10)
        val links = listOf(
            "🏆  Друзі та чат" to "https://vshshsg229-hash.github.io/kh-kozak-pubg/community.html",
            "🎮  Мініігри" to "https://vshshsg229-hash.github.io/kh-kozak-pubg/minigames.html",
            "🎵  Музика" to "https://vshshsg229-hash.github.io/kh-kozak-pubg/music.html",
            "👤  Мій акаунт" to "https://vshshsg229-hash.github.io/kh-kozak-pubg/account.html",
            "✈  Telegram" to "https://t.me/tt_KH_Kozak",
            "♪  TikTok" to "https://www.tiktok.com/@khkozak4"
        )
        links.chunked(2).forEach { pair ->
            val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
            pair.forEachIndexed { index, item ->
                val button = actionButton(item.first, Color.rgb(34, 39, 60), white).apply { textSize = 12f }
                button.setOnClickListener { openWebPage(item.second, item.first.substringAfter("  ")) }
                row.addView(button, LinearLayout.LayoutParams(0, dp(48), 1f).apply {
                    if (index == 0) marginEnd = dp(8)
                })
            }
            content.addView(row)
            addGap(content, 8)
        }
        addGap(content, 12)

        content.addView(sectionTitle("ГОЛОСОВИЙ РЕЖИМ", "05"))
        addGap(content, 10)
        val voicePanel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded(panel, 22)
            setPadding(dp(14), dp(14), dp(14), dp(14))
        }
        voicePanel.addView(text("Скажи «Козак, відкрий YouTube» або «Козак, знайди погоду».", 14f, white, false))
        addGap(voicePanel, 12)
        val start = actionButton("🎙  Запустити слухання", purple, white)
        start.setOnClickListener { ensurePermissionsAndStart() }
        voicePanel.addView(start, LinearLayout.LayoutParams(-1, dp(50)))
        addGap(voicePanel, 8)
        val stop = actionButton("■  Зупинити слухання", Color.rgb(61, 36, 54), Color.rgb(255, 177, 198))
        stop.setOnClickListener {
            stopService(Intent(this@MainActivity, WakeWordService::class.java))
            statusText.text = "  Голосове слухання зупинено"
            Toast.makeText(this, "Слухання зупинено", Toast.LENGTH_SHORT).show()
        }
        voicePanel.addView(stop, LinearLayout.LayoutParams(-1, dp(48)))
        content.addView(voicePanel)
        addGap(content, 20)

        content.addView(sectionTitle("РОЗУМНІ ВІДПОВІДІ AI", "06"))
        addGap(content, 10)
        val aiPanel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded(panel, 22)
            setPadding(dp(16), dp(14), dp(16), dp(14))
        }
        aiPanel.addView(text("Щоб помічник міг вільно відповідати на запитання як AI-чат і читати відповіді вголос, додай адресу свого захищеного AI-сервера. API-ключ має зберігатися тільки на сервері.", 13f, muted, false))
        addGap(aiPanel, 10)
        val aiEndpointInput = EditText(this).apply {
            hint = "https://твій-worker.workers.dev/chat"
            textSize = 13f
            setSingleLine(true)
            inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_URI
            setTextColor(white)
            setHintTextColor(muted)
            setPadding(dp(12), dp(12), dp(12), dp(12))
            background = rounded(Color.rgb(12, 15, 28), 12)
            setText(getSharedPreferences("kh_assistant_ai", MODE_PRIVATE).getString("endpoint", "") ?: "")
        }
        aiPanel.addView(aiEndpointInput, LinearLayout.LayoutParams(-1, dp(48)))
        addGap(aiPanel, 8)
        val saveAi = actionButton("💬  Зберегти AI-сервер", purple, white)
        saveAi.setOnClickListener {
            val endpoint = aiEndpointInput.text.toString().trim()
            if (endpoint.isNotEmpty() && !endpoint.startsWith("https://")) {
                Toast.makeText(this, "Адреса має починатися з https://", Toast.LENGTH_LONG).show()
            } else {
                getSharedPreferences("kh_assistant_ai", MODE_PRIVATE).edit().putString("endpoint", endpoint).apply()
                Toast.makeText(this, if (endpoint.isBlank()) "AI-сервер вимкнено. Команди продовжать працювати." else "AI-сервер збережено. Вільні відповіді озвучуватимуться.", Toast.LENGTH_LONG).show()
            }
        }
        aiPanel.addView(saveAi, LinearLayout.LayoutParams(-1, dp(48)))
        content.addView(aiPanel)
        addGap(content, 20)

        content.addView(sectionTitle("ДОСТУП ДО ФАЙЛІВ", "07"))
        addGap(content, 10)
        val filePanel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = rounded(panel, 22)
            setPadding(dp(16), dp(14), dp(16), dp(14))
        }
        filePanel.addView(text("Вибирай конкретний файл вручну — доступ надається лише до вибраного.", 13f, muted, false))
        addGap(filePanel, 10)
        val chooseFile = actionButton("＋  Вибрати файл", Color.rgb(34, 39, 60), white)
        chooseFile.setOnClickListener { chooseFileForAccess() }
        filePanel.addView(chooseFile, LinearLayout.LayoutParams(-1, dp(46)))
        fileStatus = text("Файл не вибрано", 12f, muted, false)
        filePanel.addView(fileStatus)
        content.addView(filePanel)
        addGap(content, 20)

        val footer = text("KH么Kozak  •  Зроблено для тебе 💜", 12f, muted, false).apply { gravity = Gravity.CENTER }
        content.addView(footer)

        setContentView(page)
        restoreSelectedFile()
    }

    private fun sectionTitle(title: String, number: String): View {
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER_VERTICAL }
        row.addView(text(number, 12f, lime, true).apply {
            background = rounded(Color.rgb(36, 49, 31), 8)
            setPadding(dp(8), dp(5), dp(8), dp(5))
        })
        row.addView(text("  $title", 13f, white, true))
        return row
    }

    private fun text(value: String, size: Float, color: Int, bold: Boolean): TextView =
        TextView(this).apply {
            text = value
            textSize = size
            setTextColor(color)
            if (bold) typeface = Typeface.DEFAULT_BOLD
            includeFontPadding = true
        }

    private fun actionButton(label: String, color: Int, foreground: Int): Button =
        Button(this).apply {
            text = label
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            setTextColor(foreground)
            isAllCaps = false
            background = rounded(color, 15)
            stateListAnimator = null
            setPadding(dp(12), dp(8), dp(12), dp(8))
        }

    private fun rounded(color: Int, radius: Int): GradientDrawable =
        GradientDrawable().apply {
            setColor(color)
            cornerRadius = dp(radius).toFloat()
        }

    private fun addGap(parent: LinearLayout, height: Int) {
        parent.addView(View(this), LinearLayout.LayoutParams(1, dp(height)))
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun sendTypedCommand() {
        val command = commandInput.text.toString().trim()
        if (command.isBlank()) {
            Toast.makeText(this, "Спочатку напиши команду.", Toast.LENGTH_SHORT).show()
            commandInput.requestFocus()
            return
        }
        rememberCommand(command)
        val intent = Intent(this, WakeWordService::class.java).apply {
            action = "TEXT_COMMAND"
            putExtra("command", command)
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(intent) else startService(intent)
            Toast.makeText(this, "Команду надіслано", Toast.LENGTH_SHORT).show()
            commandInput.text.clear()
        } catch (_: Exception) {
            Toast.makeText(this, "Не вдалося надіслати команду. Спробуй запустити помічника ще раз.", Toast.LENGTH_LONG).show()
        }
    }

    private fun loadCommandHistory(): MutableList<String> {
        val raw = getSharedPreferences("kh_assistant_history", MODE_PRIVATE).getString("commands", "[]") ?: "[]"
        return try {
            val json = org.json.JSONArray(raw)
            (0 until json.length()).map { json.optString(it).trim() }
                .filter { it.isNotBlank() }.distinctBy { it.lowercase(Locale.ROOT) }.take(8).toMutableList()
        } catch (_: Exception) { mutableListOf() }
    }

    private fun rememberCommand(command: String) {
        val items = loadCommandHistory()
        items.removeAll { it.equals(command, ignoreCase = true) }
        items.add(0, command)
        val json = org.json.JSONArray()
        items.take(8).forEach { json.put(it) }
        getSharedPreferences("kh_assistant_history", MODE_PRIVATE).edit().putString("commands", json.toString()).apply()
        renderCommandHistory()
    }

    private fun renderCommandHistory() {
        if (!::historyContainer.isInitialized) return
        historyContainer.removeAllViews()
        val items = loadCommandHistory()
        if (items.isEmpty()) {
            historyContainer.addView(text("Тут з’являться твої останні команди. Натисни команду, щоб повторити її.", 12f, muted, false))
            return
        }
        items.forEach { savedCommand ->
            val button = actionButton("↻   $savedCommand", Color.rgb(29, 33, 49), white).apply {
                gravity = Gravity.START or Gravity.CENTER_VERTICAL
                textSize = 13f
            }
            button.setOnClickListener {
                commandInput.setText(savedCommand)
                commandInput.setSelection(commandInput.text.length)
                sendTypedCommand()
            }
            historyContainer.addView(button, LinearLayout.LayoutParams(-1, dp(44)).apply { bottomMargin = dp(6) })
        }
    }

    private fun openWebPage(url: String, label: String) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        } catch (_: Exception) {
            Toast.makeText(this, "Не вдалося відкрити $label. Перевір браузер та інтернет.", Toast.LENGTH_LONG).show()
        }
    }

    private fun chooseFileForAccess() {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
        }
        try {
            startActivityForResult(intent, filePickerRequestCode)
        } catch (_: Exception) {
            Toast.makeText(this, "Не вдалося відкрити вибір файлів.", Toast.LENGTH_LONG).show()
        }
    }

    @Deprecated("Using the activity result callback for compatibility with the current starter app")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != filePickerRequestCode || resultCode != RESULT_OK) return
        val uri: Uri = data?.data ?: return
        val grantedFlags = (data.flags and Intent.FLAG_GRANT_READ_URI_PERMISSION) or
            (data.flags and Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
        try { contentResolver.takePersistableUriPermission(uri, grantedFlags) } catch (_: SecurityException) { }
        getSharedPreferences("kh_assistant_files", MODE_PRIVATE).edit().putString("selected_uri", uri.toString()).apply()
        val displayName = queryDisplayName(uri) ?: uri.lastPathSegment ?: "Вибраний файл"
        fileStatus.text = "Доступ надано до: $displayName"
        Toast.makeText(this, "Файл вибрано. Додаток має доступ лише до цього файлу.", Toast.LENGTH_LONG).show()
    }

    private fun restoreSelectedFile() {
        val saved = getSharedPreferences("kh_assistant_files", MODE_PRIVATE).getString("selected_uri", null) ?: return
        val uri = Uri.parse(saved)
        fileStatus.text = "Раніше вибраний файл: " + (queryDisplayName(uri) ?: uri.lastPathSegment ?: "Вибраний файл")
    }

    private fun queryDisplayName(uri: Uri): String? {
        return try {
            contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) cursor.getString(0) else null
            }
        } catch (_: Exception) { null }
    }

    private fun ensurePermissionsAndStart() {
        // Voice recognition needs microphone access; camera access is handled by Android camera intents when required.
        val permissions = mutableListOf(Manifest.permission.RECORD_AUDIO)
        if (Build.VERSION.SDK_INT >= 33) permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        val missing = permissions.filter { checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED }
        if (missing.isNotEmpty()) requestPermissions(missing.toTypedArray(), requestCode) else startWakeService()
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == this.requestCode && grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) startWakeService()
    }

    private fun startWakeService() {
        val intent = Intent(this, WakeWordService::class.java)
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(intent) else startService(intent)
            statusText.text = "  Голосове слухання активовано"
            Toast.makeText(this, "KH Assistant слухає. Скажи «Козак» і команду.", Toast.LENGTH_LONG).show()
        } catch (_: Exception) {
            Toast.makeText(this, "Не вдалося запустити слухання.", Toast.LENGTH_LONG).show()
        }
    }
}
