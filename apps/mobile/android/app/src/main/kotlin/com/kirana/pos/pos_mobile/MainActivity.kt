package com.kirana.pos.pos_mobile

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.pm.PackageManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.content.Context
import android.view.WindowManager
import androidx.annotation.NonNull
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.IOException
import java.util.UUID

class MainActivity : FlutterActivity() {
    private val CHANNEL = "in.assistt.pos/bluetooth_printer"
    private val HARDWARE_CHANNEL = "in.assistt.pos/hardware"
    private val SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    private val PERMISSION_REQUEST_CODE = 1001
    private val CAMERA_PERMISSION_REQUEST_CODE = 1002
    private val STORAGE_PERMISSION_REQUEST_CODE = 1003

    private var activeSocket: BluetoothSocket? = null
    private var connectedAddress: String? = null
    private var pendingPermissionResult: MethodChannel.Result? = null

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "requestPermissions" -> {
                    if (hasBluetoothPermissions()) {
                        result.success(true)
                        return@setMethodCallHandler
                    }

                    pendingPermissionResult = result
                    val permsToRequest = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        arrayOf(
                            Manifest.permission.BLUETOOTH_CONNECT,
                            Manifest.permission.BLUETOOTH_SCAN
                        )
                    } else {
                        arrayOf(
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.BLUETOOTH,
                            Manifest.permission.BLUETOOTH_ADMIN
                        )
                    }
                    ActivityCompat.requestPermissions(this, permsToRequest, PERMISSION_REQUEST_CODE)
                }

                "isBluetoothEnabled" -> {
                    val adapter = BluetoothAdapter.getDefaultAdapter()
                    result.success(adapter?.isEnabled == true)
                }

                "getPairedDevices" -> {
                    val adapter = BluetoothAdapter.getDefaultAdapter()
                    if (adapter == null) {
                        result.error("NO_ADAPTER", "Bluetooth is not supported on this device", null)
                        return@setMethodCallHandler
                    }

                    if (!adapter.isEnabled) {
                        result.error("BLUETOOTH_DISABLED", "Bluetooth is disabled. Please turn on Bluetooth.", null)
                        return@setMethodCallHandler
                    }

                    if (!hasBluetoothPermissions()) {
                        result.error("PERMISSION_DENIED", "Nearby devices / Bluetooth permission not granted", null)
                        return@setMethodCallHandler
                    }

                    try {
                        val devices = adapter.bondedDevices
                        val list = mutableListOf<Map<String, String>>()
                        for (device: BluetoothDevice in devices) {
                            list.add(
                                mapOf(
                                    "name" to (device.name ?: "Thermal Printer"),
                                    "address" to device.address
                                )
                            )
                        }
                        result.success(list)
                    } catch (e: SecurityException) {
                        result.error("PERMISSION_DENIED", "Bluetooth permission not granted", e.message)
                    } catch (e: Exception) {
                        result.error("ERROR", "Failed to get paired devices: ${e.message}", null)
                    }
                }

                "connect" -> {
                    val address = call.argument<String>("address")
                    if (address == null) {
                        result.error("INVALID_ARGUMENT", "Device address is required", null)
                        return@setMethodCallHandler
                    }

                    val adapter = BluetoothAdapter.getDefaultAdapter()
                    if (adapter == null) {
                        result.error("NO_ADAPTER", "Bluetooth is not supported", null)
                        return@setMethodCallHandler
                    }

                    if (!adapter.isEnabled) {
                        result.error("BLUETOOTH_DISABLED", "Bluetooth is disabled. Please turn on Bluetooth.", null)
                        return@setMethodCallHandler
                    }

                    if (!hasBluetoothPermissions()) {
                        result.error("PERMISSION_DENIED", "Nearby devices / Bluetooth permission not granted", null)
                        return@setMethodCallHandler
                    }

                    Thread {
                        try {
                            // Close existing socket cleanly
                            try {
                                activeSocket?.close()
                            } catch (_: Exception) {}
                            activeSocket = null

                            val device = adapter.getRemoteDevice(address)
                            adapter.cancelDiscovery() // Cancel scan to maximize RFCOMM throughput

                            var socket: BluetoothSocket? = null
                            try {
                                socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
                                socket.connect()
                            } catch (standardEx: Exception) {
                                // Fallback: Reflection RFCOMM channel 1 for budget 58mm/80mm printers
                                try {
                                    socket?.close()
                                } catch (_: Exception) {}
                                val method = device.javaClass.getMethod("createRfcommSocket", Int::class.javaPrimitiveType)
                                socket = method.invoke(device, 1) as BluetoothSocket
                                socket.connect()
                            }

                            activeSocket = socket
                            connectedAddress = address

                            runOnUiThread { result.success(true) }
                        } catch (e: Exception) {
                            try {
                                activeSocket?.close()
                            } catch (_: Exception) {}
                            activeSocket = null
                            connectedAddress = null
                            runOnUiThread {
                                result.error("CONNECT_FAILED", "Could not connect to $address: ${e.message}", null)
                            }
                        }
                    }.start()
                }

                "disconnect" -> {
                    try {
                        activeSocket?.close()
                        activeSocket = null
                        connectedAddress = null
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("DISCONNECT_FAILED", e.message, null)
                    }
                }

                "isConnected" -> {
                    val isConn = activeSocket?.isConnected == true
                    result.success(isConn)
                }

                "sendBytes" -> {
                    val bytes = call.argument<ByteArray>("bytes")
                    if (bytes == null) {
                        result.error("INVALID_ARGUMENT", "Bytes payload is required", null)
                        return@setMethodCallHandler
                    }

                    val socket = activeSocket
                    if (socket == null || !socket.isConnected) {
                        result.error("NOT_CONNECTED", "Printer is not connected", null)
                        return@setMethodCallHandler
                    }

                    Thread {
                        try {
                            socket.outputStream.write(bytes)
                            socket.outputStream.flush()
                            runOnUiThread { result.success(true) }
                        } catch (e: IOException) {
                            try {
                                socket.close()
                            } catch (_: Exception) {}
                            activeSocket = null
                            connectedAddress = null
                            runOnUiThread {
                                result.error("WRITE_FAILED", "Failed to write bytes to printer: ${e.message}", null)
                            }
                        }
                    }.start()
                }

                else -> {
                    result.notImplemented()
                }
            }
        }

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, HARDWARE_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "checkPermission" -> {
                    val permission = call.argument<String>("permission")
                    val granted = when (permission) {
                        "bluetooth" -> hasBluetoothPermissions()
                        "camera" -> ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
                        "storage" -> hasStoragePermissions()
                        else -> false
                    }
                    result.success(granted)
                }

                "requestPermission" -> {
                    val permission = call.argument<String>("permission")
                    when (permission) {
                        "camera" -> {
                            if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                                result.success(true)
                            } else {
                                pendingPermissionResult = result
                                ActivityCompat.requestPermissions(
                                    this,
                                    arrayOf(Manifest.permission.CAMERA),
                                    CAMERA_PERMISSION_REQUEST_CODE
                                )
                            }
                        }
                        "storage" -> {
                            if (hasStoragePermissions()) {
                                result.success(true)
                            } else {
                                pendingPermissionResult = result
                                val perms = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                    arrayOf(Manifest.permission.READ_MEDIA_IMAGES)
                                } else {
                                    arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE)
                                }
                                ActivityCompat.requestPermissions(this, perms, STORAGE_PERMISSION_REQUEST_CODE)
                            }
                        }
                        else -> {
                            if (hasBluetoothPermissions()) {
                                result.success(true)
                            } else {
                                pendingPermissionResult = result
                                val perms = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                    arrayOf(Manifest.permission.BLUETOOTH_CONNECT, Manifest.permission.BLUETOOTH_SCAN)
                                } else {
                                    arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.BLUETOOTH)
                                }
                                ActivityCompat.requestPermissions(this, perms, PERMISSION_REQUEST_CODE)
                            }
                        }
                    }
                }

                "setScreenWakeLock" -> {
                    val enabled = call.argument<Boolean>("enabled") ?: false
                    runOnUiThread {
                        if (enabled) {
                            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                        } else {
                            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                        }
                        result.success(true)
                    }
                }

                "triggerHaptic" -> {
                    val type = call.argument<String>("type") ?: "light"
                    try {
                        val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                        if (vibrator != null && vibrator.hasVibrator()) {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                val effect = when (type) {
                                    "success" -> VibrationEffect.createOneShot(50, VibrationEffect.DEFAULT_AMPLITUDE)
                                    "error" -> VibrationEffect.createWaveform(longArrayOf(0, 40, 40, 40), -1)
                                    else -> VibrationEffect.createOneShot(20, VibrationEffect.DEFAULT_AMPLITUDE)
                                }
                                vibrator.vibrate(effect)
                            } else {
                                @Suppress("DEPRECATION")
                                vibrator.vibrate(30)
                            }
                        }
                        result.success(true)
                    } catch (_: Exception) {
                        result.success(false)
                    }
                }

                else -> {
                    result.notImplemented()
                }
            }
        }
    }

    private fun hasStoragePermissions(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) == PackageManager.PERMISSION_GRANTED
        } else {
            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun hasBluetoothPermissions(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val connect = ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT)
            val scan = ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN)
            connect == PackageManager.PERMISSION_GRANTED && scan == PackageManager.PERMISSION_GRANTED
        } else {
            val fineLoc = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            fineLoc == PackageManager.PERMISSION_GRANTED
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            PERMISSION_REQUEST_CODE,
            CAMERA_PERMISSION_REQUEST_CODE,
            STORAGE_PERMISSION_REQUEST_CODE -> {
                val isGranted = grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }
                pendingPermissionResult?.success(isGranted)
                pendingPermissionResult = null
            }
        }
    }
}
