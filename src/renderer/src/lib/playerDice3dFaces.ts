import * as THREE from 'three'
import { faceLabelsForDie, type PlayerDice3dDie } from '../../../shared/playerDice3d'

export type DieFace = {
  label: string
  normal: THREE.Vector3
  center: THREE.Vector3
  size: number
  vertices: THREE.Vector3[]
}

export type D4CornerMark = {
  face: DieFace
  vertex: THREE.Vector3
  label: string
}

type Cluster = {
  normal: THREE.Vector3
  center: THREE.Vector3
  area: number
  starts: number[]
  vertices: THREE.Vector3[]
}

const FACE_DOT = 0.88
const SAME_POINT = 1e-6
const TABLE_DOWN = new THREE.Vector3(0, -1, 0)

function vertexAt(
  position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  index: number
): THREE.Vector3 {
  return new THREE.Vector3(position.getX(index), position.getY(index), position.getZ(index))
}

function rememberVertex(cluster: Cluster, vertex: THREE.Vector3): void {
  if (cluster.vertices.some((point) => point.distanceToSquared(vertex) < SAME_POINT)) return
  cluster.vertices.push(vertex.clone())
}

function emptyCluster(): Cluster {
  return {
    normal: new THREE.Vector3(),
    center: new THREE.Vector3(),
    area: 0,
    starts: [],
    vertices: []
  }
}

function triangleAt(
  position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  a: number,
  b: number,
  c: number
): { normal: THREE.Vector3; center: THREE.Vector3; area: number } | null {
  const ax = position.getX(a)
  const ay = position.getY(a)
  const az = position.getZ(a)
  const bx = position.getX(b)
  const by = position.getY(b)
  const bz = position.getZ(b)
  const cx = position.getX(c)
  const cy = position.getY(c)
  const cz = position.getZ(c)
  const abx = bx - ax
  const aby = by - ay
  const abz = bz - az
  const acx = cx - ax
  const acy = cy - ay
  const acz = cz - az
  const nx = aby * acz - abz * acy
  const ny = abz * acx - abx * acz
  const nz = abx * acy - aby * acx
  const length = Math.hypot(nx, ny, nz)
  if (length < 1e-8) return null
  const area = length * 0.5
  return {
    normal: new THREE.Vector3(nx / length, ny / length, nz / length),
    center: new THREE.Vector3((ax + bx + cx) / 3, (ay + by + cy) / 3, (az + bz + cz) / 3),
    area
  }
}

function sortClusters(clusters: Cluster[]): Cluster[] {
  return [...clusters].sort((left, right) => {
    if (Math.abs(left.normal.y - right.normal.y) > 0.04) return right.normal.y - left.normal.y
    const leftYaw = Math.atan2(left.normal.z, left.normal.x)
    const rightYaw = Math.atan2(right.normal.z, right.normal.x)
    return leftYaw - rightYaw
  })
}

function facesFromGroups(geometry: THREE.BufferGeometry, labels: string[]): DieFace[] {
  const position = geometry.getAttribute('position')
  const index = geometry.getIndex()
  const byMaterial = new Map<number, Cluster>()
  for (const group of geometry.groups) {
    const materialIndex = group.materialIndex ?? 0
    const cluster = byMaterial.get(materialIndex) ?? emptyCluster()
    const last = group.start + group.count
    for (let start = group.start; start < last; start += 3) {
      const a = index ? index.getX(start) : start
      const b = index ? index.getX(start + 1) : start + 1
      const c = index ? index.getX(start + 2) : start + 2
      const tri = triangleAt(position, a, b, c)
      if (!tri) continue
      rememberVertex(cluster, vertexAt(position, a))
      rememberVertex(cluster, vertexAt(position, b))
      rememberVertex(cluster, vertexAt(position, c))
      const nextArea = cluster.area + tri.area
      if (cluster.area === 0) {
        cluster.normal.copy(tri.normal)
        cluster.center.copy(tri.center)
      } else {
        cluster.center
          .multiplyScalar(cluster.area)
          .addScaledVector(tri.center, tri.area)
          .divideScalar(nextArea)
        cluster.normal
          .multiplyScalar(cluster.area)
          .addScaledVector(tri.normal, tri.area)
          .divideScalar(nextArea)
          .normalize()
      }
      cluster.area = nextArea
      cluster.starts.push(start)
    }
    byMaterial.set(materialIndex, cluster)
  }
  return [...byMaterial.entries()]
    .sort((left, right) => left[0] - right[0])
    .slice(0, labels.length)
    .map(([_, cluster], index) => faceFromCluster(labels[index] ?? String(index + 1), cluster))
}

export function extractDieFaces(geometry: THREE.BufferGeometry, labels: string[]): DieFace[] {
  const grouped = facesFromGroups(geometry, labels)
  if (grouped.length === labels.length) return grouped

  const position = geometry.getAttribute('position')
  const index = geometry.getIndex()
  const clusters: Cluster[] = []
  const triangleCount = index ? index.count / 3 : position.count / 3

  const visit = (start: number, a: number, b: number, c: number): void => {
    const tri = triangleAt(position, a, b, c)
    if (!tri) return
    const match = clusters.find((cluster) => cluster.normal.dot(tri.normal) > FACE_DOT)
    if (!match) {
      const cluster = emptyCluster()
      cluster.normal.copy(tri.normal)
      cluster.center.copy(tri.center)
      cluster.area = tri.area
      cluster.starts.push(start)
      rememberVertex(cluster, vertexAt(position, a))
      rememberVertex(cluster, vertexAt(position, b))
      rememberVertex(cluster, vertexAt(position, c))
      clusters.push(cluster)
      return
    }
    rememberVertex(match, vertexAt(position, a))
    rememberVertex(match, vertexAt(position, b))
    rememberVertex(match, vertexAt(position, c))
    const nextArea = match.area + tri.area
    match.center
      .multiplyScalar(match.area)
      .addScaledVector(tri.center, tri.area)
      .divideScalar(nextArea)
    match.normal
      .multiplyScalar(match.area)
      .addScaledVector(tri.normal, tri.area)
      .divideScalar(nextArea)
      .normalize()
    match.area = nextArea
    match.starts.push(start)
  }

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      visit(i, index.getX(i), index.getX(i + 1), index.getX(i + 2))
    }
  } else {
    for (let i = 0; i < position.count; i += 3) {
      visit(i, i, i + 1, i + 2)
    }
  }

  const ordered = sortClusters(clusters).slice(0, labels.length)
  geometry.clearGroups()
  ordered.forEach((cluster, materialIndex) => {
    for (const start of cluster.starts) {
      geometry.addGroup(start, 3, materialIndex)
    }
  })

  if (ordered.length === 0 && triangleCount > 0) {
    geometry.addGroup(0, index ? index.count : position.count, 0)
  }

  return ordered.map((cluster, index) => faceFromCluster(labels[index] ?? String(index + 1), cluster))
}

function faceFromCluster(label: string, cluster: Cluster): DieFace {
  const normal = cluster.normal.clone()
  if (normal.dot(cluster.center) < 0) normal.negate()
  return {
    label,
    normal,
    center: cluster.center.clone(),
    size: Math.max(0.28, Math.sqrt(cluster.area) * 0.92),
    vertices: cluster.vertices.map((vertex) => vertex.clone())
  }
}

export function createD10Geometry(): THREE.BufferGeometry {
  const top = new THREE.Vector3(0, 1.05, 0)
  const bottom = new THREE.Vector3(0, -1.05, 0)
  const n = 5
  const r = 0.88
  const mid = 0.16
  const upper: THREE.Vector3[] = []
  const lower: THREE.Vector3[] = []
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    const b = a + Math.PI / n
    upper.push(new THREE.Vector3(Math.cos(a) * r, mid, Math.sin(a) * r))
    lower.push(new THREE.Vector3(Math.cos(b) * r, -mid, Math.sin(b) * r))
  }
  const positions: number[] = []
  const geometryGroups: [number, number, number][] = []
  const push = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3): void => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
  }
  for (let i = 0; i < n; i += 1) {
    const next = (i + 1) % n
    const north = positions.length / 3
    push(top, lower[i]!, upper[i]!)
    push(top, upper[next]!, lower[i]!)
    const south = positions.length / 3
    push(bottom, lower[i]!, upper[next]!)
    push(bottom, upper[next]!, lower[next]!)
    geometryGroups.push([north, 6, i * 2], [south, 6, i * 2 + 1])
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  for (const [start, count, materialIndex] of geometryGroups) {
    geometry.addGroup(start, count, materialIndex)
  }
  return geometry
}

export function resultDieFace(faces: DieFace[], die: PlayerDice3dDie): DieFace {
  return (
    faces.find((face) => face.label === die.label) ??
    faces[0] ?? {
      label: die.label,
      normal: new THREE.Vector3(0, 1, 0),
      center: new THREE.Vector3(0, 0, 0),
      size: 0.4,
      vertices: []
    }
  )
}

export const DICE_3D_CAMERA_POSITION = new THREE.Vector3(-1.2, 9.4, 12.6)
export const DICE_3D_LOOK_AT = new THREE.Vector3(-1.4, 0.2, 0)

/** Direction from the table to the camera, so a landed face sits flat to the screen. */
export function landingTarget(direction?: THREE.Vector3): THREE.Vector3 {
  if (direction) return direction.clone().normalize()
  return DICE_3D_CAMERA_POSITION.clone().sub(DICE_3D_LOOK_AT).normalize()
}

export function landingQuaternion(faceNormal: THREE.Vector3, target = landingTarget()): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(faceNormal.clone().normalize(), target.clone().normalize())
}

/** A d4 sits on the result face (point up). Other dice turn that face to the camera. */
export function d4SitQuaternion(resultNormal: THREE.Vector3): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(resultNormal.clone().normalize(), TABLE_DOWN)
}

export function d4LandingQuaternion(
  result: DieFace,
  faces: DieFace[],
  target = landingTarget()
): THREE.Quaternion {
  const sit = d4SitQuaternion(result.normal)
  const camHoriz = new THREE.Vector3(target.x, 0, target.z)
  if (camHoriz.lengthSq() < 1e-8) return sit
  camHoriz.normalize()
  const standing = faces.filter((face) => face.label !== result.label)
  let best = sit
  let bestScore = -Infinity
  for (let i = 0; i < standing.length; i += 1) {
    for (let j = i + 1; j < standing.length; j += 1) {
      const first = standing[i]!.normal.clone().applyQuaternion(sit)
      const second = standing[j]!.normal.clone().applyQuaternion(sit)
      const firstHoriz = new THREE.Vector3(first.x, 0, first.z)
      const secondHoriz = new THREE.Vector3(second.x, 0, second.z)
      if (firstHoriz.lengthSq() < 1e-8 || secondHoriz.lengthSq() < 1e-8) continue
      const ridge = firstHoriz.normalize().add(secondHoriz.normalize())
      if (ridge.lengthSq() < 1e-8) continue
      ridge.normalize()
      const yaw = Math.atan2(camHoriz.x * ridge.z - camHoriz.z * ridge.x, camHoriz.dot(ridge))
      const next = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiply(sit)
      const towardA = standing[i]!.normal.clone().applyQuaternion(next).dot(target)
      const towardB = standing[j]!.normal.clone().applyQuaternion(next).dot(target)
      const score = Math.min(towardA, towardB)
      if (score > bestScore) {
        bestScore = score
        best = next
      }
    }
  }
  return best
}

function samePoint(left: THREE.Vector3, right: THREE.Vector3): boolean {
  return left.distanceToSquared(right) < SAME_POINT
}

/** Classic d4: each corner shows the number of the opposite face (the point-up result). */
export function d4CornerMarks(faces: DieFace[]): D4CornerMark[] {
  const marks: D4CornerMark[] = []
  for (const face of faces) {
    for (const vertex of face.vertices) {
      const opposite = faces.find((other) => !other.vertices.some((point) => samePoint(point, vertex)))
      marks.push({ face, vertex: vertex.clone(), label: opposite?.label ?? face.label })
    }
  }
  return marks
}

export function faceLabels(die: PlayerDice3dDie): string[] {
  return faceLabelsForDie(die)
}
