import * as THREE from 'three'
import {
  DICE_3D_RESERVED_RIGHT,
  DICE_3D_THROW_MS,
  type PlayerDice3dDie
} from '../../../shared/playerDice3d'
import {
  DICE_3D_CAMERA_POSITION,
  DICE_3D_LOOK_AT,
  d4CornerMarks,
  d4LandingQuaternion,
  extractDieFaces,
  faceLabels,
  landingQuaternion,
  landingTarget,
  resultDieFace,
  type DieFace
} from './playerDice3dFaces'
import { createDieGeometry } from './playerDice3dMeshes'
import {
  DIE_GLYPH_CANVAS,
  dieBodyScale,
  dieGlyphTone,
  diePlasticColor,
  heightToNormalMap,
  paintDieGlyph,
  paintDieGlyphHeight
} from './playerDice3dLook'

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

function dieGeometry(spec: PlayerDice3dDie): THREE.BufferGeometry {
  return createDieGeometry(spec)
}

function faceMaps(
  label: string,
  sides: number,
  opts: { dropped: boolean; highlight: 'none' | 'nat20' | 'nat1' }
): { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture } {
  const color = document.createElement('canvas')
  color.width = DIE_GLYPH_CANVAS
  color.height = DIE_GLYPH_CANVAS
  const colorCtx = color.getContext('2d')
  if (colorCtx) paintDieGlyph(colorCtx, label, dieGlyphTone(opts), sides)
  const map = new THREE.CanvasTexture(color)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 8

  const height = document.createElement('canvas')
  height.width = DIE_GLYPH_CANVAS
  height.height = DIE_GLYPH_CANVAS
  const heightCtx = height.getContext('2d')
  if (heightCtx) {
    paintDieGlyphHeight(heightCtx, label, sides)
    const pixels = heightCtx.getImageData(0, 0, DIE_GLYPH_CANVAS, DIE_GLYPH_CANVAS)
    pixels.data.set(heightToNormalMap(pixels.data, DIE_GLYPH_CANVAS, DIE_GLYPH_CANVAS))
    heightCtx.putImageData(pixels, 0, 0)
  }
  const normalMap = new THREE.CanvasTexture(height)
  normalMap.colorSpace = THREE.NoColorSpace
  normalMap.anisotropy = 8
  return { map, normalMap }
}

function resinGrainTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#b8b0a4'
    ctx.fillRect(0, 0, 64, 64)
    for (let i = 0; i < 70; i += 1) {
      const n = 150 + Math.round(Math.random() * 70)
      ctx.fillStyle = `rgb(${n},${n},${n})`
      ctx.beginPath()
      ctx.arc(Math.random() * 64, Math.random() * 64, 3 + Math.random() * 9, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2.2, 2.2)
  texture.colorSpace = THREE.NoColorSpace
  return texture
}

function createStudioEnvironment(): THREE.Scene {
  const studio = new THREE.Scene()
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xe8dcc8, side: THREE.BackSide })
  )
  room.scale.set(18, 12, 18)
  studio.add(room)
  const panel = (color: number, intensity: number, position: THREE.Vector3, scale: THREE.Vector3): void => {
    const mat = new THREE.MeshLambertMaterial({
      color: 0x000000,
      emissive: new THREE.Color(color),
      emissiveIntensity: intensity
    })
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat)
    mesh.position.copy(position)
    mesh.scale.copy(scale)
    studio.add(mesh)
  }
  panel(0xfff4e0, 90, new THREE.Vector3(0, 9, 0), new THREE.Vector3(8, 0.15, 8))
  panel(0xffe4b8, 42, new THREE.Vector3(-6, 6, 4), new THREE.Vector3(3.2, 2.2, 0.12))
  panel(0xc8d8f0, 20, new THREE.Vector3(6, 4, -3), new THREE.Vector3(2.4, 2, 0.12))
  return studio
}

function attachStudioIbl(renderer: THREE.WebGLRenderer, scene: THREE.Scene): () => void {
  try {
    const pmrem = new THREE.PMREMGenerator(renderer)
    const studio = createStudioEnvironment()
    const env = pmrem.fromScene(studio, 0.04)
    scene.environment = env.texture
    scene.environmentIntensity = 0.88
    studio.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const material of materials) material.dispose()
      }
    })
    pmrem.dispose()
    return () => {
      env.dispose()
      scene.environment = null
    }
  } catch {
    return () => undefined
  }
}

function disposeMaterialMaps(material: THREE.Material): void {
  const physical = material as THREE.MeshPhysicalMaterial
  for (const key of ['map', 'normalMap'] as const) {
    const texture = physical[key]
    if (texture instanceof THREE.Texture) texture.dispose()
  }
  material.dispose()
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
  const maps = faceMaps(label, spec.sides, {
    dropped: Boolean(spec.dropped),
    highlight: highlightFor(spec, label)
  })
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshPhysicalMaterial({
      map: maps.map,
      normalMap: maps.normalMap,
      normalScale: new THREE.Vector2(0.72, 0.72),
      roughness: 0.38,
      metalness: 0,
      clearcoat: spec.dropped ? 0.15 : 0.45,
      clearcoatRoughness: 0.28,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    })
  )
  decal.position.copy(position).addScaledVector(normal, 0.028)
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
  spec: PlayerDice3dDie,
  grain: THREE.CanvasTexture
): { group: THREE.Group; spinner: THREE.Group; result: DieFace; faces: DieFace[]; scale: number } {
  const group = new THREE.Group()
  const spinner = new THREE.Group()
  const geometry = dieGeometry(spec)
  const labels = faceLabels(spec)
  const faces = extractDieFaces(geometry, labels)
  const result = resultDieFace(faces, spec)
  const scale = dieBodyScale(spec.sides)
  const body = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      color: diePlasticColor(spec.dropped),
      roughness: 0.32,
      roughnessMap: grain,
      metalness: 0,
      clearcoat: spec.dropped ? 0.2 : 0.78,
      clearcoatRoughness: 0.22,
      sheen: 0.2,
      sheenColor: new THREE.Color(0xf6ead4),
      sheenRoughness: 0.48,
      ior: 1.5,
      specularIntensity: 0.5,
      envMapIntensity: 0.85,
      vertexColors: Boolean(geometry.getAttribute('color')),
      transparent: Boolean(spec.dropped),
      opacity: spec.dropped ? 0.5 : 1
    })
  )
  spinner.scale.setScalar(scale)
  spinner.add(body)
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
  shadow.scale.setScalar(scale)
  shadow.position.y = spec.sides <= 4 ? -result.center.length() * scale : -0.72
  group.add(spinner, shadow)
  return { group, spinner, result, faces, scale }
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

  const disposeIbl = attachStudioIbl(renderer, scene)
  scene.add(new THREE.HemisphereLight(0xfff3dc, 0x1c1610, 0.48))
  const key = new THREE.DirectionalLight(0xfff1d8, 1.05)
  key.position.set(-4, 14, 10)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0x9bb6d8, 0.28)
  fill.position.set(8, 5, -5)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffe4b8, 0.32)
  rim.position.set(2, 3, -10)
  scene.add(rim)

  const feltWidth = 14
  const feltDepth = 8
  const usable = 1 - reservedRight
  const stageShift = feltWidth * (0.5 - usable / 2)
  const grain = resinGrainTexture()
  const ends = landingGrid(dice.length, feltWidth * 0.62, feltDepth * 0.7).map(
    (spot) => spot.add(new THREE.Vector3(-stageShift, 0, 0))
  )
  const flyers: FlyingDie[] = dice.map((spec, index) => {
    const made = makeDie(spec, grain)
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
      end.y = made.result.center.length() * made.scale + 0.02
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
      disposeIbl()
      grain.dispose()
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose()
        }
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Sprite) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
          for (const material of materials) disposeMaterialMaps(material)
        }
      })
    }
  }
}
