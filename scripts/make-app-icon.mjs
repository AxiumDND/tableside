import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const INK = [20, 24, 32, 255]
const AMBER = [230, 211, 138, 255]
const AMBER_SIDE = [168, 150, 86, 255]
const AMBER_DIM = [122, 110, 68, 255]
const PARCHMENT = [230, 235, 242, 255]
const LINE = [52, 60, 74, 255]

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

function pointInConvex(x, y, pts) {
  let sign = 0
  for (let i = 0; i < pts.length; i += 1) {
    const [ax, ay] = pts[i]
    const [bx, by] = pts[(i + 1) % pts.length]
    const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax)
    const s = Math.sign(cross)
    if (s === 0) continue
    if (sign === 0) sign = s
    else if (s !== sign) return false
  }
  return sign !== 0
}

function mix(dst, i, color, a) {
  const inv = 1 - a
  dst[i] = Math.round(dst[i] * inv + color[0] * a)
  dst[i + 1] = Math.round(dst[i + 1] * inv + color[1] * a)
  dst[i + 2] = Math.round(dst[i + 2] * inv + color[2] * a)
  dst[i + 3] = 255
}

function fillPoly(rgba, size, pts, color, coverage = 1) {
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const minX = Math.max(0, Math.floor(Math.min(...xs)))
  const maxX = Math.min(size - 1, Math.ceil(Math.max(...xs)))
  const minY = Math.max(0, Math.floor(Math.min(...ys)))
  const maxY = Math.min(size - 1, Math.ceil(Math.max(...ys)))
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      let hits = 0
      for (let oy = 0.25; oy < 1; oy += 0.5) {
        for (let ox = 0.25; ox < 1; ox += 0.5) {
          if (pointInConvex(x + ox, y + oy, pts)) hits += 1
        }
      }
      if (!hits) continue
      mix(rgba, (y * size + x) * 4, color, (hits / 4) * coverage)
    }
  }
}

function strokePoly(rgba, size, pts, color, width) {
  for (let i = 0; i < pts.length; i += 1) {
    const [ax, ay] = pts[i]
    const [bx, by] = pts[(i + 1) % pts.length]
    const dx = bx - ax
    const dy = by - ay
    const len = Math.hypot(dx, dy) || 1
    const nx = (-dy / len) * width
    const ny = (dx / len) * width
    fillPoly(
      rgba,
      size,
      [
        [ax + nx, ay + ny],
        [bx + nx, by + ny],
        [bx - nx, by - ny],
        [ax - nx, ay - ny]
      ],
      color
    )
  }
}

function drawIcon(size) {
  const rgba = Buffer.alloc(size * size * 4, 0)
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = INK[0]
    rgba[i + 1] = INK[1]
    rgba[i + 2] = INK[2]
    rgba[i + 3] = 255
  }
  const p = (x, y) => [x * size, y * size]
  const w = size >= 48 ? 1.15 : size >= 32 ? 1.0 : 0.85

  fillPoly(rgba, size, [p(0.08, 0.72), p(0.92, 0.72), p(0.98, 0.9), p(0.02, 0.9)], AMBER_DIM)
  fillPoly(rgba, size, [p(0.3, 0.74), p(0.7, 0.74), p(0.72, 0.86), p(0.28, 0.86)], PARCHMENT)
  if (size >= 32) {
    strokePoly(
      rgba,
      size,
      [p(0.38, 0.76), p(0.62, 0.76), p(0.63, 0.84), p(0.37, 0.84)],
      LINE,
      w * 0.35
    )
  }

  const left = [p(0.2, 0.22), p(0.38, 0.16), p(0.38, 0.68), p(0.16, 0.72)]
  const center = [p(0.38, 0.16), p(0.62, 0.16), p(0.62, 0.68), p(0.38, 0.68)]
  const right = [p(0.62, 0.16), p(0.8, 0.22), p(0.84, 0.72), p(0.62, 0.68)]
  fillPoly(rgba, size, left, AMBER_SIDE)
  fillPoly(rgba, size, right, AMBER_SIDE)
  fillPoly(rgba, size, center, AMBER)
  strokePoly(rgba, size, left, INK, w * 0.45)
  strokePoly(rgba, size, right, INK, w * 0.45)
  strokePoly(rgba, size, center, INK, w * 0.45)
  return rgba
}

function dib32(size, rgba) {
  const header = Buffer.alloc(40)
  header.writeUInt32LE(40, 0)
  header.writeInt32LE(size, 4)
  header.writeInt32LE(size * 2, 8)
  header.writeUInt16LE(1, 12)
  header.writeUInt16LE(32, 14)
  const xor = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    const srcY = size - 1 - y
    for (let x = 0; x < size; x += 1) {
      const si = (srcY * size + x) * 4
      const di = (y * size + x) * 4
      xor[di] = rgba[si + 2]
      xor[di + 1] = rgba[si + 1]
      xor[di + 2] = rgba[si]
      xor[di + 3] = rgba[si + 3]
    }
  }
  const andRow = Math.ceil(size / 32) * 4
  const andMask = Buffer.alloc(andRow * size)
  return Buffer.concat([header, xor, andMask])
}

function encodeIco(images) {
  const count = images.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(count, 4)
  const entries = []
  const blobs = []
  let offset = 6 + 16 * count
  for (const image of images) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(image.size >= 256 ? 0 : image.size, 0)
    entry.writeUInt8(image.size >= 256 ? 0 : image.size, 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(image.data.length, 8)
    entry.writeUInt32LE(offset, 12)
    entries.push(entry)
    blobs.push(image.data)
    offset += image.data.length
  }
  return Buffer.concat([header, ...entries, ...blobs])
}

const png256 = encodePng(256, 256, drawIcon(256))
const ico = encodeIco(
  [16, 24, 32, 48, 64, 128, 256].map((size) => ({
    size,
    data: size === 256 ? png256 : dib32(size, drawIcon(size))
  }))
)

const targets = [
  join(root, 'resources', 'icon.png'),
  join(root, 'resources', 'icon.ico'),
  join(root, 'src', 'renderer', 'src', 'assets', 'icon.png')
]
mkdirSync(join(root, 'src', 'renderer', 'src', 'assets'), { recursive: true })
writeFileSync(targets[0], png256)
writeFileSync(targets[1], ico)
writeFileSync(targets[2], png256)
console.log(`wrote ${targets.join('\n')}`)
