import qrcode
import sys
import os

URL_FILE = os.path.join(os.path.dirname(__file__), '..', 'dist', 'url.txt')
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'demo')
OUT_FILE = os.path.join(OUT_DIR, 'qr-code.png')

if not os.path.exists(OUT_DIR):
    os.makedirs(OUT_DIR)

with open(URL_FILE, 'r') as f:
    data = f.read().strip()

qr = qrcode.QRCode(
    version=None,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)
qr.add_data(data)
qr.make(fit=True)

version = qr.version
print(f"Generated QR Code Version: {version}")

if version > 40:
    print(f"ERROR: QR Code Version {version} exceeds the maximum standard (40).", file=sys.stderr)
    sys.exit(1)

img = qr.make_image(fill_color="black", back_color="white")
img.save(OUT_FILE)
print(f"Saved to {OUT_FILE}")
print(f"Dimensions: {img.pixel_size} pixels")
