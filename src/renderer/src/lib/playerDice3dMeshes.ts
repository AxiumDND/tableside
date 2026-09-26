import * as THREE from 'three'
import {
  createD10Geometry,
  extractDieFaces,
  faceLabels,
  type DieFace
} from './playerDice3dFaces'
import type { PlayerDice3dDie } from '../../../shared/playerDice3d'

const SAME = 1e-6

function almost(left: THREE.Vector3, right: THREE.Vector3): boolean {
  return left.distanceToSquared(right) < SAME
}

function quantize(vertex: THREE.Vector3): string {
  return `${vertex.x.toFixed(4)},${vertex.y.toFixed(4)},${vertex.z.toFixed(4)}`
}

function edgeKey(a: THREE.Vector3, b: THREE.Vector3): string {
  const left = quantize(a)
  const right = quantize(b)
  return left < right ? `${left}|${right}` : `${right}|${left}`
}

/** CCW around the outward normal so inset and winding stay consistent. */
export function orderFaceRing(vertices: THREE.Vector3[], normal: THREE.Vector3): THREE.Vector3[] {
  const unique: THREE.Vector3[] = []
  for (const vertex of vertices) {
    if (!unique.some((point) => almost(point, vertex))) unique.push(vertex.clone())
  }
  if (unique.length < 3) return unique
  const center = unique.reduce((sum, vertex) => sum.add(vertex), new THREE.Vector3()).divideScalar(unique.length)
  const hint = Math.abs(normal.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
  const tangent = new THREE.Vector3().crossVectors(hint, normal).normalize()
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize()
  unique.sort((left, right) => {
    const a = left.clone().sub(center)
    const b = right.clone().sub(center)
    return (
      Math.atan2(a.dot(bitangent), a.dot(tangent)) - Math.atan2(b.dot(bitangent), b.dot(tangent))
    )
  })
  return unique
}

function insetRing(ring: THREE.Vector3[], normal: THREE.Vector3, amount: number): THREE.Vector3[] {
  const count = ring.length
  const inset: THREE.Vector3[] = []
  for (let i = 0; i < count; i += 1) {
    const prev = ring[(i + count - 1) % count]!
    const curr = ring[i]!
    const next = ring[(i + 1) % count]!
    const e1 = curr.clone().sub(prev).normalize()
    const e2 = next.clone().sub(curr).normalize()
    const n1 = new THREE.Vector3().crossVectors(normal, e1).normalize()
    const n2 = new THREE.Vector3().crossVectors(normal, e2).normalize()
    const bisector = n1.clone().add(n2)
    if (bisector.lengthSq() < 1e-8) {
      inset.push(curr.clone().addScaledVector(n1, amount))
      continue
    }
    bisector.normalize()
    const denom = bisector.dot(n1)
    const dist = Math.abs(denom) < 1e-4 ? amount : amount / denom
    inset.push(curr.clone().addScaledVector(bisector, dist))
  }
  return inset
}

function minEdgeLength(faces: DieFace[]): number {
  let min = Infinity
  for (const face of faces) {
    const ring = orderFaceRing(face.vertices, face.normal)
    for (let i = 0; i < ring.length; i += 1) {
      min = Math.min(min, ring[i]!.distanceTo(ring[(i + 1) % ring.length]!))
    }
  }
  return min
}

export function chamferAmountForFaces(faces: DieFace[]): number {
  const edge = minEdgeLength(faces)
  if (!Number.isFinite(edge) || edge <= 0) return 0.08
  return Math.min(0.16, Math.max(0.06, edge * 0.12))
}

type BuiltFace = {
  normal: THREE.Vector3
  ring: THREE.Vector3[]
  inset: THREE.Vector3[]
}

function pushTriangle(
  positions: number[],
  colors: number[],
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  color: THREE.Color
): void {
  const ab = b.clone().sub(a)
  const ac = c.clone().sub(a)
  const n = new THREE.Vector3().crossVectors(ab, ac)
  const mid = a.clone().add(b).add(c).divideScalar(3)
  const first = a
  let second = b
  let third = c
  if (n.dot(mid) < 0) {
    second = c
    third = b
  }
  for (const vertex of [first, second, third]) {
    positions.push(vertex.x, vertex.y, vertex.z)
    colors.push(color.r, color.g, color.b)
  }
}

const FACE_TINT = new THREE.Color(1, 1, 1)
const EDGE_TINT = new THREE.Color(0.82, 0.76, 0.68)
const CORNER_TINT = new THREE.Color(0.74, 0.68, 0.6)

/**
 * Shrink each reading face and fill the gaps with flat bevels.
 * Groups 0..N-1 are the original faces so extractDieFaces still finds them.
 */
export function createChamferedDieGeometry(faces: DieFace[], amount: number): THREE.BufferGeometry {
  const built: BuiltFace[] = faces.map((face) => {
    const ring = orderFaceRing(face.vertices, face.normal)
    return { normal: face.normal.clone(), ring, inset: insetRing(ring, face.normal, amount) }
  })

  const positions: number[] = []
  const colors: number[] = []
  const groups: { start: number; count: number; materialIndex: number }[] = []

  built.forEach((face, materialIndex) => {
    const start = positions.length / 3
    const center = face.inset
      .reduce((sum, vertex) => sum.add(vertex), new THREE.Vector3())
      .divideScalar(face.inset.length)
    for (let i = 0; i < face.inset.length; i += 1) {
      pushTriangle(
        positions,
        colors,
        center,
        face.inset[i]!,
        face.inset[(i + 1) % face.inset.length]!,
        FACE_TINT
      )
    }
    groups.push({ start, count: (positions.length / 3 - start), materialIndex })
  })

  const seenEdges = new Set<string>()
  for (let i = 0; i < built.length; i += 1) {
    const face = built[i]!
    for (let e = 0; e < face.ring.length; e += 1) {
      const a = face.ring[e]!
      const b = face.ring[(e + 1) % face.ring.length]!
      const key = edgeKey(a, b)
      if (seenEdges.has(key)) continue
      seenEdges.add(key)
      let otherIndex = -1
      let otherEdge = -1
      for (let j = 0; j < built.length; j += 1) {
        if (j === i) continue
        const other = built[j]!
        for (let k = 0; k < other.ring.length; k += 1) {
          const c = other.ring[k]!
          const d = other.ring[(k + 1) % other.ring.length]!
          if (edgeKey(c, d) === key) {
            otherIndex = j
            otherEdge = k
            break
          }
        }
        if (otherIndex >= 0) break
      }
      if (otherIndex < 0) continue
      const other = built[otherIndex]!
      const a0 = face.inset[e]!
      const a1 = face.inset[(e + 1) % face.inset.length]!
      const otherA = other.inset[otherEdge]!
      const otherB = other.inset[(otherEdge + 1) % other.inset.length]!
      const bNearA = a0.distanceToSquared(otherA) < a0.distanceToSquared(otherB) ? otherA : otherB
      const bNearB = a1.distanceToSquared(otherA) < a1.distanceToSquared(otherB) ? otherA : otherB
      pushTriangle(positions, colors, a0, a1, bNearB, EDGE_TINT)
      pushTriangle(positions, colors, a0, bNearB, bNearA, EDGE_TINT)
    }
  }

  const corners = new Map<string, { vertex: THREE.Vector3; insets: THREE.Vector3[] }>()
  for (const face of built) {
    for (let i = 0; i < face.ring.length; i += 1) {
      const vertex = face.ring[i]!
      const key = quantize(vertex)
      const entry = corners.get(key) ?? { vertex: vertex.clone(), insets: [] }
      const inset = face.inset[i]!
      if (!entry.insets.some((point) => almost(point, inset))) entry.insets.push(inset.clone())
      corners.set(key, entry)
    }
  }
  for (const { vertex, insets } of corners.values()) {
    if (insets.length < 3) continue
    const outward = vertex.clone().normalize()
    const hint = Math.abs(outward.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
    const tangent = new THREE.Vector3().crossVectors(hint, outward).normalize()
    const bitangent = new THREE.Vector3().crossVectors(outward, tangent).normalize()
    insets.sort((left, right) => {
      const a = left.clone().sub(vertex)
      const b = right.clone().sub(vertex)
      return (
        Math.atan2(a.dot(bitangent), a.dot(tangent)) - Math.atan2(b.dot(bitangent), b.dot(tangent))
      )
    })
    const center = insets
      .reduce((sum, point) => sum.add(point), new THREE.Vector3())
      .divideScalar(insets.length)
    for (let i = 0; i < insets.length; i += 1) {
      pushTriangle(positions, colors, center, insets[i]!, insets[(i + 1) % insets.length]!, CORNER_TINT)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  for (const group of groups) {
    geometry.addGroup(group.start, group.count, group.materialIndex)
  }
  return geometry
}

function rawDieGeometry(sides: number): THREE.BufferGeometry {
  if (sides <= 4) return new THREE.TetrahedronGeometry(1.12)
  if (sides <= 6) return new THREE.BoxGeometry(1.28, 1.28, 1.28)
  if (sides <= 8) return new THREE.OctahedronGeometry(1.12)
  if (sides <= 10) return createD10Geometry()
  if (sides <= 12) return new THREE.DodecahedronGeometry(1.14)
  return new THREE.IcosahedronGeometry(1.2)
}

/** d4 stays sharp (vertex numbers). Everything else gets a tumbled chamfer. */
export function createDieGeometry(spec: Pick<PlayerDice3dDie, 'sides' | 'faceSet'>): THREE.BufferGeometry {
  const raw = rawDieGeometry(spec.sides)
  if (spec.sides <= 4) return raw
  const labels = faceLabels({ sides: spec.sides, value: 1, label: '1', faceSet: spec.faceSet })
  const faces = extractDieFaces(raw, labels)
  raw.dispose()
  if (faces.length !== labels.length) return rawDieGeometry(spec.sides)
  return createChamferedDieGeometry(faces, chamferAmountForFaces(faces))
}
