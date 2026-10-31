# 07 — Hardware Integration Specification

## 1. Principles

- Hardware must be accessed through interfaces/adapters.
- Business logic must not contain manufacturer-specific code.
- Printing is a post-commit operation.
- A print failure must never create a second sale.
- Maintain a tested compatibility matrix; do not claim universal support.

## 2. Printer abstraction

Define a common interface:

```text
PrinterService
  discover()
  connect(profile, connection)
  getStatus()
  printReceipt(receiptDocument)
  printTestPage()
  openCashDrawer()
  disconnect()
```

ReceiptDocument should be semantic, not raw printer commands:
- business header
- branch/address/GSTIN
- invoice number/date
- item lines
- quantity/rate/discount/tax
- subtotal/tax/total
- payment breakdown
- footer/QR if configured

A renderer converts semantic document to ESC/POS or another supported output.

## 3. Transport adapters

- Android Bluetooth Classic where printer supports it.
- Android USB OTG where device and printer support it.
- Network printer through local network where supported.
- Windows USB through local bridge.
- Windows Bluetooth through local bridge and supported OS APIs.

Bluetooth Low Energy and Bluetooth Classic are different; confirm the EXEO device's actual transport and protocol.

## 4. ESC/POS profiles

Each tested model profile records:
- manufacturer/model
- paper width (58mm/80mm)
- printable dots/columns
- command compatibility
- code pages
- raster image support
- QR/barcode support
- cut support
- cash drawer kick support
- connection method
- known limitations

## 5. EXEO EX-5810 validation checklist

Before declaring supported:
1. Confirm exact model and hardware revision.
2. Identify Bluetooth mode and pairing behaviour.
3. Identify USB mode and Android OTG behaviour.
4. Confirm ESC/POS command support.
5. Test 58mm layout and line wrapping.
6. Test English.
7. Test Hindi and Bengali using raster/bitmap rendering if needed.
8. Test logo and QR.
9. Test low battery and reconnection.
10. Test repeated/partial print failure.
11. Test paper-out and cover-open status if exposed.
12. Record firmware and app compatibility.

The listing's claim of compatibility with many receipt apps does not prove custom ESC/POS compatibility.

## 6. Windows local hardware bridge

A small locally installed service:
- binds only to loopback by default
- requires pairing/short-lived token
- validates allowed web origin
- uses a narrow API allowlist
- does not expose arbitrary shell commands
- has explicit versioning and health endpoint
- logs hardware errors without invoice PII

Endpoints:
- `GET /health`
- `POST /pair`
- `GET /printers`
- `POST /print/test`
- `POST /print/receipt`
- `POST /drawer/open`

Use CORS allowlist and origin checks. Protect against DNS rebinding and unauthorised local websites. Consider native messaging or a signed desktop agent if browser security constraints make direct localhost access unreliable.

## 7. Barcode scanner

First support keyboard-wedge USB scanners, which type scanned data as keyboard input. The POS input must:
- maintain focus safely
- recognise configured suffix (Enter/Tab)
- debounce duplicate events
- handle unknown barcode
- resolve barcode to product/variant/unit
- allow manual search fallback

Later support serial/Bluetooth scanner SDKs where required.

## 8. Cash drawer

Many drawers connect to the printer's RJ11/RJ12 kick port and require an ESC/POS drawer pulse. Confirm pinout and supported pulse. Never assume a drawer is directly addressable through USB.

## 9. Print job lifecycle

- sale posted
- print job created
- printer selected
- render receipt
- send bytes
- mark printed or failed
- allow reprint with clear duplicate-copy label if configured

A reprint must reference the original invoice and must not post another sale.
