import * as THREE from 'three'
import { faceLabelsForDie, type PlayerDice3dDie } from '../../../shared/playerDice3d'

export type DieFace = {
  label: string
  normal: THREE.Vector3
  center: THREE.Vector3
  size: number
}

type Cluster = {
  normal: THREE.Vector3
  center: THREE.Vector3
  area: number
  starts: number[]
}

const FACE_DOT = 0.88

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
    const cluster = byMaterial.get(materialIndex) ?? {
      normal: new THREE.Vector3(),
      center: new THREE.Vector3(),
      area: 0,
      starts: []
    }
    const last = group.start + group.count
    for (let start = group.start; start < last; start += 3) {
      const a = index ? index.getX(start) : start
      const b = index ? index.getX(start + 1) : start + 1
      const c = index ? index.getX(start + 2) : start + 2
      const tri = triangleAt(position, a, b, c)
      if (!tri) continue
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
    .map(([_, cluster], index) => ({
      label: labels[index] ?? String(index + 1),
      normal: cluster.normal.clone(),
      center: cluster.center.clone(),
      size: Math.max(0.28, Math.sqrt(cluster.area) * 0.92)
    }))
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
      clusters.push({
        normal: tri.normal,
        center: tri.center,
        area: tri.area,
        starts: [start]
      })
      return
    }
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

  return ordered.map((cluster, index) => ({
    label: labels[index] ?? String(index + 1),
    normal: cluster.normal.clone(),
    center: cluster.center.clone(),
    size: Math.max(0.28, Math.sqrt(cluster.area) * 0.92)
  }))
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
    push(top, upper[i]!, lower[i]!)
    push(top, lower[i]!, upper[next]!)
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
      size: 0.4
    }
  )
}

export function landingQuaternion(faceNormal: THREE.Vector3, tilt = 0.34): THREE.Quaternion {
  const target = new THREE.Vector3(0, 1, tilt).normalize()
  return new THREE.Quaternion().setFromUnitVectors(faceNormal.clone().normalize(), target)
}

export function faceLabels(die: PlayerDice3dDie): string[] {
  return faceLabelsForDie(die)
}
