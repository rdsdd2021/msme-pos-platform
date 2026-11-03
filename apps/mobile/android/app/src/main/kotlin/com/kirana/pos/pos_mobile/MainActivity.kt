package com.kirana.pos.pos_mobile

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import androidx.annotation.NonNull
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.IOException
import java.util.UUID

class MainActivity : FlutterActivity() {
    private val CHANNEL = "in.assistt.pos/bluetooth_printer"
    private val SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

    private var activeSocket: BluetoothSocket? = null
    private var connectedAddress: String? = null

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "getPairedDevices" -> {
                    val adapter = BluetoothAdapter.getDefaultAdapter()
                    if (adapter == null) {
                        result.success(emptyList<Map<String, String>>())
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
                        result.error("ERROR", "Failed to get paired devices", e.message)
                    }
                }
                "connect" -> {
                    val address = call.argument<String>("address")
                    if (address == null) {
                        result.error("INVALID_ARGUMENT", "Device address is required", null)
                        return@setMethodCallHandler
                    }

                    Thread {
                        val adapter = BluetoothAdapter.getDefaultAdapter()
                        if (adapter == null) {
                            runOnUiThread { result.error("NO_ADAPTER", "Bluetooth is not supported", null) }
                            return@Thread
                        }

                        try {
                            // Close existing socket if connecting to different device
                            activeSocket?.close()
                            activeSocket = null

                            val device = adapter.getRemoteDevice(address)
                            adapter.cancelDiscovery() // Cancel discovery to maximize transfer speed

                            val socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
                            socket.connect()

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
    }
}
