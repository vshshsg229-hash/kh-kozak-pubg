package com.khkozak.assistant

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import android.provider.OpenableColumns

class MainActivity : Activity() {
    private val requestCode = 1402
    private val filePickerRequestCode = 1403
    private lateinit var fileStatus: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(28, 32, 28, 32)
            setBackgroundColor(0xFF090B10.toInt())
        }
        val title = TextView(this).apply {
            text = "KH么Kozak Assistant"
            textSize = 27f
            setTextColor(0xFFD6FF57.toInt())
            gravity = Gravity.CENTER
        }
        val desc = TextView(this).apply {
            text = "Натисни «Запустити слухання», залиш службу активною й скажи: «Козак, відкрий YouTube».\n\nДоступ до файлів надається лише для файлів, які ти сам вибереш."
            textSize = 16f
            setTextColor(0xFFF3F6FC.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 24, 0, 24)
        }
        val start = Button(this).apply {
            text = "Запустити слухання"
            setOnClickListener { ensurePermissionsAndStart() }
        }
        val stop = Button(this).apply {
            text = "Зупинити слухання"
            setOnClickListener { stopService(Intent(this@MainActivity, WakeWordService::class.java)) }
        }
        val chooseFile = Button(this).apply {
            text = "Надати доступ до файлу"
            setOnClickListener { chooseFileForAccess() }
        }
        fileStatus = TextView(this).apply {
            text = "Файл не вибрано"
            textSize = 14f
            setTextColor(0xFFF3F6FC.toInt())
            gravity = Gravity.CENTER
            setPadding(0, 12, 0, 12)
        }
        root.addView(title)
        root.addView(desc)
        root.addView(start)
        root.addView(stop)
        root.addView(chooseFile)
        root.addView(fileStatus)
        setContentView(root)
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
        try {
            contentResolver.takePersistableUriPermission(uri, grantedFlags)
        } catch (_: SecurityException) {
            // Some document providers grant only temporary access; keep the current selection usable.
        }
        val displayName = queryDisplayName(uri) ?: uri.lastPathSegment ?: "Вибраний файл"
        fileStatus.text = "Доступ надано до: $displayName"
        Toast.makeText(this, "Файл вибрано. Додаток має доступ лише до цього файлу.", Toast.LENGTH_LONG).show()
    }

    private fun queryDisplayName(uri: Uri): String? {
        return try {
            contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) cursor.getString(0) else null
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun ensurePermissionsAndStart() {
        val permissions = mutableListOf(Manifest.permission.RECORD_AUDIO)
        if (Build.VERSION.SDK_INT >= 33) permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        val missing = permissions.filter { checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED }
        if (missing.isNotEmpty()) {
            requestPermissions(missing.toTypedArray(), requestCode)
        } else startWakeService()
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == this.requestCode && grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) startWakeService()
    }

    private fun startWakeService() {
        val intent = Intent(this, WakeWordService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(intent) else startService(intent)
    }
}
