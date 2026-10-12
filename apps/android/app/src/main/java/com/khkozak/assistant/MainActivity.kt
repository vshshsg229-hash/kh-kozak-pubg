package com.khkozak.assistant

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    private val requestCode = 1402
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
            text = "Натисни «Запустити слухання», залиш службу активною й скажи: «Козак, відкрий YouTube»."
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
        root.addView(title)
        root.addView(desc)
        root.addView(start)
        root.addView(stop)
        setContentView(root)
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
