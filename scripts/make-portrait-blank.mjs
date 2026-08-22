import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const WIDTH = 384
const HEIGHT = 512

const INK = [20, 24, 32]
const LINE = [52, 60, 74]
const AMBER = [168, 150, 86]
const SILHOUETTE = [42, 48, 60]

function crc32(buf) {
  let crc = 0xffffffff
  for (const byte of buf) {
    crc ^= byte
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const tag = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([tag, data])))
  return Buffer.concat([len, tag, data, crc])
}

function encodePng(width, height, rgba) {
  const stride = width * 4 + 1
  const raw = Buffer.alloc(stride * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * stride] = 0
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}

function setPx(rgba, x, y, color, a = 1) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return
  const i = (y * WIDTH + x) * 4
  const inv = 1 - a
  rgba[i] = Math.round(rgba[i] * inv + color[0] * a)
  rgba[i + 1] = Math.round(rgba[i + 1] * inv + color[1] * a)
  rgba[i + 2] = Math.round(rgba[i + 2] * inv + color[2] * a)
  rgba[i + 3] = 255
}

function fillRect(rgba, x0, y0, x1, y1, color) {
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) setPx(rgba, x, y, color)
  }
}

function fillEllipse(rgba, cx, cy, rx, ry, color) {
  const rx2 = rx * rx
  const ry2 = ry * ry
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
      const dx = x - cx
      const dy = y - cy
      if ((dx * dx) / rx2 + (dy * dy) / ry2 <= 1) setPx(rgba, x, y, color)
    }
  }
}

const rgba = Buffer.alloc(WIDTH * HEIGHT * 4, 255)
for (let i = 0; i < WIDTH * HEIGHT; i += 1) {
  rgba[i * 4] = INK[0]
  rgba[i * 4 + 1] = INK[1]
  rgba[i * 4 + 2] = INK[2]
}

const inset = 18
fillRect(rgba, inset, inset, WIDTH - 1 - inset, inset + 3, LINE)
fillRect(rgba, inset, HEIGHT - 1 - inset - 3, WIDTH - 1 - inset, HEIGHT - 1 - inset, LINE)
fillRect(rgba, inset, inset, inset + 3, HEIGHT - 1 - inset, LINE)
fillRect(rgba, WIDTH - 1 - inset - 3, inset, WIDTH - 1 - inset, HEIGHT - 1 - inset, LINE)
fillRect(rgba, inset, inset, inset + 14, inset + 3, AMBER)
fillRect(rgba, WIDTH - 1 - inset - 14, HEIGHT - 1 - inset - 3, WIDTH - 1 - inset, HEIGHT - 1 - inset, AMBER)

fillEllipse(rgba, WIDTH / 2, 200, 58, 70, SILHOUETTE)
fillEllipse(rgba, WIDTH / 2, 390, 110, 130, SILHOUETTE)
fillRect(rgba, 0, 470, WIDTH - 1, HEIGHT - 1, INK)

const png = encodePng(WIDTH, HEIGHT, rgba)
const dest = join(root, 'src', 'renderer', 'src', 'assets', 'portrait-blank.png')
mkdirSync(dirname(dest), { recursive: true })
writeFileSync(dest, png)
console.log('wrote', dest, png.length, 'bytes')
