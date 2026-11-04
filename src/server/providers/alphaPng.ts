import { crc32, deflateSync } from "node:zlib";

function chunk(type: string, data: Buffer): Buffer {
  const typed = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const out = Buffer.alloc(typed.length + 8);
  out.writeUInt32BE(data.length, 0);
  typed.copy(out, 4);
  out.writeUInt32BE(crc32(typed), typed.length + 4);
  return out;
}

/** White pixels whose alpha comes from a row-major 0/1 raster, as an 8-bit grey+alpha PNG data URL. */
export function alphaPngDataUrl(raster: Uint8Array, width: number, height: number): string {
  const rowBytes = 1 + width * 2; // a filter byte, then grey and alpha per pixel
  const pixels = Buffer.alloc(rowBytes * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const at = y * rowBytes + 1 + x * 2;
      pixels[at] = 255;
      pixels[at + 1] = raster[y * width + x] ? 255 : 0;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 4; // grey + alpha
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString("base64")}`;
}
