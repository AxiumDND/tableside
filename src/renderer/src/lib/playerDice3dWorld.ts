import * as THREE from 'three'
import {
  DICE_3D_RESERVED_RIGHT,
  DICE_3D_THROW_MS,
  type PlayerDice3dDie
} from '../../../shared/playerDice3d'
import {
  DICE_3D_CAMERA_POSITION,
  DICE_3D_LOOK_AT,
  createD10Geometry,
  d4CornerMarks,
  d4LandingQuaternion,
  extractDieFaces,
  faceLabels,
  landingQuaternion,
  landingTarget,
  resultDieFace,
  type DieFace
} from './playerDice3dFaces'
import { dieGlyphTone, diePlasticColor, paintDieGlyph } from './playerDice3dLook'

export type PlayerDice3dHandle = {
  dispose: () => void
}

type MountOpts = {
  throwMs?: number
  reservedRight?: number
}

type FlyingDie = {
  group: THREE.Group
  spinner: THREE.Group
  start: THREE.Vector3
  end: THREE.Vector3
  startQuat: THREE.Quaternion
  endQuat: THREE.Quaternion
  spin: THREE.Euler
}

function webglAvailable(): boolean {
  const probe = document.createElement('canvas')
  try {
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'))
  } catch {
    return false
  }
}

function dieGeometry(sides: number): THREE.BufferGeometry {
  if (sides <= 4) return new THREE.TetrahedronGeometry(1.12)
  if (sides <= 6) return new THREE.BoxGeometry(1.28, 1.28, 1.28)
  if (sides <= 8) return new THREE.OctahedronGeometry(1.12)
  if (sides <= 10) return createD10Geometry()
  if (sides <= 12) return new THREE.DodecahedronGeometry(1.14)
  return new THREE.IcosahedronGeometry(1.2)
}

function faceTexture(
  label: string,
  opts: { dropped: boolean; highlight: 'none' | 'nat20' | 'nat1' }
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) paintDieGlyph(ctx, label, dieGlyphTone(opts))
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

function contactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const glow = ctx.createRadialGradient(64, 64, 8, 64, 64, 62)
    glow.addColorStop(0, 'rgba(0, 0, 0, 0.42)')
    glow.addColorStop(0.55, 'rgba(0, 0, 0, 0.16)')
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, 128, 128)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function highlightFor(spec: PlayerDice3dDie, label: string): 'none' | 'nat20' | 'nat1' {
  if (spec.dropped || spec.sides !== 20 || label !== spec.label) return 'none'
  if (spec.value === 20) return 'nat20'
  if (spec.value === 1) return 'nat1'
  return 'none'
}

function twistDecalOnFace(mesh: THREE.Mesh, face: THREE.Vector3, desired: THREE.Vector3): void {
  if (desired.lengthSq() < 1e-8) return
  desired.normalize()
  const localZ = new THREE.Vector3(0, 0, 1)
  const after = new THREE.Vector3(0, 1, 0).applyQuaternion(mesh.quaternion)
  const cross = new THREE.Vector3().crossVectors(after, desired)
  const angle = Math.atan2(face.dot(cross), after.dot(desired))
  mesh.rotateOnAxis(localZ, angle)
}

function orientFaceDecal(mesh: THREE.Mesh, normal: THREE.Vector3): void {
  const face = normal.clone().normalize()
  const localZ = new THREE.Vector3(0, 0, 1)
  mesh.quaternion.setFromUnitVectors(localZ, face)
  const target = landingTarget()
  const landing = new THREE.Quaternion().setFromUnitVectors(face, target)
  const after = new THREE.Vector3(0, 1, 0).applyQuaternion(mesh.quaternion).applyQuaternion(landing)
  const worldUp = new THREE.Vector3(0, 1, 0)
  const desired = worldUp.clone().addScaledVector(target, -worldUp.dot(target))
  if (desired.lengthSq() < 1e-8) return
  desired.normalize()
  const cross = new THREE.Vector3().crossVectors(after, desired)
  const angle = Math.atan2(target.dot(cross), after.dot(desired))
  mesh.rotateOnAxis(localZ, angle)
}

function orientD4CornerDecal(mesh: THREE.Mesh, normal: THREE.Vector3, towardVertex: THREE.Vector3): void {
  const face = normal.clone().normalize()
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), face)
  const desired = towardVertex.clone().addScaledVector(face, -towardVertex.dot(face))
  twistDecalOnFace(mesh, face, desired)
}

function addFaceDecal(
  spinner: THREE.Group,
  position: THREE.Vector3,
  normal: THREE.Vector3,
  label: string,
  size: number,
  spec: PlayerDice3dDie,
  orient: (mesh: THREE.Mesh) => void
): void {
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: faceTexture(label, {
        dropped: Boolean(spec.dropped),
        highlight: highlightFor(spec, label)
      }),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    })
  )
  decal.position.copy(position).addScaledVector(normal, 0.035)
  orient(decal)
  decal.scale.setScalar(size)
  spinner.add(decal)
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

function landingGrid(count: number, width: number, depth: number): THREE.Vector3[] {
  const cols = Math.min(count, count <= 4 ? count : 6)
  const rows = Math.ceil(count / cols)
  const gapX = width / Math.max(cols, 1)
  const gapZ = depth / Math.max(rows, 1)
  const spots: THREE.Vector3[] = []
  for (let i = 0; i < count; i += 1) {
    const row = Math.floor(i / cols)
    const col = i % cols
    const rowCount = Math.min(cols, count - row * cols)
    const x = (col - (rowCount - 1) / 2) * Math.min(gapX, 2.35)
    const z = (row - (rows - 1) / 2) * Math.min(gapZ, 2.2)
    spots.push(new THREE.Vector3(x, 0.72, z))
  }
  return spots
}

function makeDie(
  spec: PlayerDice3dDie
): { group: THREE.Group; spinner: THREE.Group; result: DieFace; faces: DieFace[] } {
  const group = new THREE.Group()
  const spinner = new THREE.Group()
  const geometry = dieGeometry(spec.sides)
  const labels = faceLabels(spec)
  const faces = extractDieFaces(geometry, labels)
  const result = resultDieFace(faces, spec)
  const body = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      color: diePlasticColor(spec.dropped),
      roughness: 0.28,
      metalness: 0,
      clearcoat: spec.dropped ? 0.2 : 0.82,
      clearcoatRoughness: 0.2,
      sheen: 0.22,
      sheenColor: new THREE.Color(0xf6ead4),
      sheenRoughness: 0.45,
      ior: 1.5,
      specularIntensity: 0.55,
      transparent: Boolean(spec.dropped),
      opacity: spec.dropped ? 0.5 : 1
    })
  )
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 22),
    new THREE.LineBasicMaterial({
      color: 0x4a3a28,
      transparent: true,
      opacity: spec.dropped ? 0.12 : 0.22
    })
  )
  spinner.add(body, edges)
  if (spec.sides <= 4) {
    for (const mark of d4CornerMarks(faces)) {
      const toward = mark.vertex.clone().sub(mark.face.center)
      const pos = mark.face.center.clone().addScaledVector(toward, 0.58)
      addFaceDecal(spinner, pos, mark.face.normal, mark.label, mark.face.size * 0.4, spec, (mesh) =>
        orientD4CornerDecal(mesh, mark.face.normal, toward)
      )
    }
  } else {
    for (const face of faces) {
      addFaceDecal(spinner, face.center, face.normal, face.label, face.size, spec, (mesh) =>
        orientFaceDecal(mesh, face.normal)
      )
    }
  }
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(spec.sides <= 4 ? 0.82 : 1.05, 32),
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: spec.dropped ? 0.35 : 0.85
    })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = spec.sides <= 4 ? -result.center.length() : -0.72
  group.add(spinner, shadow)
  return { group, spinner, result, faces }
}

export function mountPlayerDice3d(
  host: HTMLElement,
  dice: PlayerDice3dDie[],
  opts: MountOpts = {}
): PlayerDice3dHandle | null {
  if (dice.length === 0) return null
  const canvas = document.createElement('canvas')
  canvas.className = 'player-dice-3d-canvas'
  if (!webglAvailable()) return null

  const throwMs = opts.throwMs ?? DICE_3D_THROW_MS
  const reservedRight = opts.reservedRight ?? DICE_3D_RESERVED_RIGHT
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  } catch {
    return null
  }
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80)
  camera.position.copy(DICE_3D_CAMERA_POSITION)
  camera.lookAt(DICE_3D_LOOK_AT)

  scene.add(new THREE.HemisphereLight(0xfff3dc, 0x1c1610, 0.62))
  const key = new THREE.DirectionalLight(0xfff1d8, 1.45)
  key.position.set(-4, 14, 10)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0x9bb6d8, 0.38)
  fill.position.set(8, 5, -5)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffe4b8, 0.42)
  rim.position.set(2, 3, -10)
  scene.add(rim)

  const feltWidth = 14
  const feltDepth = 8
  const usable = 1 - reservedRight
  const stageShift = feltWidth * (0.5 - usable / 2)
  const ends = landingGrid(dice.length, feltWidth * 0.62, feltDepth * 0.7).map(
    (spot) => spot.add(new THREE.Vector3(-stageShift, 0, 0))
  )
  const flyers: FlyingDie[] = dice.map((spec, index) => {
    const made = makeDie(spec)
    const end = ends[index] ?? new THREE.Vector3()
    const start = new THREE.Vector3(
      end.x + (Math.random() - 0.5) * 7,
      6 + Math.random() * 3,
      end.z - 4 - Math.random() * 3
    )
    const startQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6)
    )
    if (spec.sides <= 4) {
      end.y = made.result.center.length() + 0.02
    }
    const endQuat =
      spec.sides <= 4
        ? d4LandingQuaternion(made.result, made.faces)
        : landingQuaternion(made.result.normal)
    made.group.position.copy(start)
    made.spinner.quaternion.copy(startQuat)
    scene.add(made.group)
    return {
      group: made.group,
      spinner: made.spinner,
      start,
      end,
      startQuat,
      endQuat,
      spin: new THREE.Euler(
        Math.PI * (2.2 + Math.random() * 1.6),
        Math.PI * (1.6 + Math.random() * 1.8),
        Math.PI * (0.8 + Math.random() * 1.2)
      )
    }
  })

  const extraSpin = new THREE.Quaternion()
  const spinEuler = new THREE.Euler()
  const scratch = new THREE.Quaternion()

  const resize = (): void => {
    const width = host.clientWidth
    const height = host.clientHeight
    if (width <= 0 || height <= 0) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  host.appendChild(canvas)
  resize()
  const observer = new ResizeObserver(resize)
  observer.observe(host)

  const started = performance.now()
  let frame = 0
  const tick = (now: number): void => {
    const t = Math.min(1, (now - started) / throwMs)
    const ease = easeOutCubic(t)
    for (const flyer of flyers) {
      flyer.group.position.lerpVectors(flyer.start, flyer.end, ease)
      flyer.group.position.y = flyer.start.y + (flyer.end.y - flyer.start.y) * ease + Math.sin((1 - t) * Math.PI) * 1.4
      flyer.spinner.quaternion.copy(flyer.startQuat).slerp(flyer.endQuat, ease)
      spinEuler.set(flyer.spin.x * (1 - ease), flyer.spin.y * (1 - ease), flyer.spin.z * (1 - ease))
      extraSpin.setFromEuler(spinEuler)
      scratch.copy(flyer.spinner.quaternion).multiply(extraSpin)
      flyer.spinner.quaternion.copy(scratch)
    }
    renderer.render(scene, camera)
    if (t < 1) frame = window.requestAnimationFrame(tick)
    else renderer.render(scene, camera)
  }
  frame = window.requestAnimationFrame(tick)

  return {
    dispose() {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.remove()
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose()
        }
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Sprite) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
          for (const material of materials) {
            const map = (material as THREE.MeshBasicMaterial).map
            if (map) map.dispose()
            material.dispose()
          }
        }
      })
    }
  }
}
