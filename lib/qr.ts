


import QRCode from "qrcode";

export async function generateQrDataUrl(url: string) {
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
  });
}