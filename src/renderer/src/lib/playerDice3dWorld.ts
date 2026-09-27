import * as THREE from 'three'
import {
  DICE_3D_RESERVED_RIGHT,
  DICE_3D_THROW_MS,
  type PlayerDice3dDie
} from '../../../shared/playerDice3d'
import {
  planDieThrowMotions,
  sampleDieThrow,
  type DieThrowMotion
} from '../../../shared/playerDice3dMotion'
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
import type { DiceLookPreset } from '../../../shared/diceLookPreset'
import {
  DIE_FACE_TEXTURE_SIZE,
  DIE_GLYPH_CANVAS,
  dieBodyMaterialInputs,
  dieBodyNormalScale,
  dieBodyScale,
  dieFaceRoughnessContrast,
  dieFaceTextureContrast,
  dieFaceTextureTint,
  dieGlyphTone,
  heightToNormalMap,
  paintDieFaceMicrotexture,
  paintDieFaceNormalMap,
  paintDieFaceRoughness,
  paintDieGlyph,
  paintDieGlyphHeight,
  resolveDiceLook
} from './playerDice3dLook'

export type PlayerDice3dHandle = {
  dispose: () => void
}

type MountOpts = {
  throwMs?: number
  reservedRight?: number
  /** Named bag look; defaults to ivory resin. */
  lookPreset?: string | DiceLookPreset | null
}

type FlyingDie = {
  group: THREE.Group
  spinner: THREE.Group
  bodyScale: number
  start: THREE.Vector3
  end: THREE.Vector3
  startQuat: THREE.Quaternion
  endQuat: THREE.Quaternion
  spin: THREE.Euler
  motion: DieThrowMotion
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
  opts: { dropped: boolean; highlight: 'none' | 'nat20' | 'nat1' },
  look: DiceLookPreset
): { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture } {
  const color = document.createElement('canvas')
  color.width = DIE_GLYPH_CANVAS
  color.height = DIE_GLYPH_CANVAS
  const colorCtx = color.getContext('2d')
  if (colorCtx) paintDieGlyph(colorCtx, label, dieGlyphTone(opts), sides, look)
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

function resinGrainTextures(look: DiceLookPreset): {
  albedo: THREE.CanvasTexture
  data: THREE.CanvasTexture
  normal: THREE.CanvasTexture
} {
  const contrast = dieFaceTextureContrast(look)
  const seed = 2.4 + look.id.length * 0.37
  const albedoCanvas = document.createElement('canvas')
  albedoCanvas.width = DIE_FACE_TEXTURE_SIZE
  albedoCanvas.height = DIE_FACE_TEXTURE_SIZE
  const albedoCtx = albedoCanvas.getContext('2d')
  if (albedoCtx) {
    paintDieFaceMicrotexture(albedoCtx, {
      seed,
      contrast,
      tintRgb: dieFaceTextureTint(look)
    })
  }
  const roughCanvas = document.createElement('canvas')
  roughCanvas.width = DIE_FACE_TEXTURE_SIZE
  roughCanvas.height = DIE_FACE_TEXTURE_SIZE
  const roughCtx = roughCanvas.getContext('2d')
  if (roughCtx) {
    paintDieFaceRoughness(roughCtx, {
      seed,
      contrast: dieFaceRoughnessContrast(look)
    })
  }
  const normalCanvas = document.createElement('canvas')
  normalCanvas.width = DIE_FACE_TEXTURE_SIZE
  normalCanvas.height = DIE_FACE_TEXTURE_SIZE
  const normalCtx = normalCanvas.getContext('2d')
  if (normalCtx) {
    paintDieFaceNormalMap(normalCtx, {
      seed,
      contrast: Math.max(contrast, 0.16),
      strength: look.metalness >= 0.5 ? 5.2 : 4.4
    })
  }
  const wrap = (texture: THREE.CanvasTexture, colorSpace: THREE.ColorSpace): THREE.CanvasTexture => {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2.6, 2.6)
    texture.anisotropy = 8
    texture.colorSpace = colorSpace
    return texture
  }
  return {
    albedo: wrap(new THREE.CanvasTexture(albedoCanvas), THREE.SRGBColorSpace),
    data: wrap(new THREE.CanvasTexture(roughCanvas), THREE.NoColorSpace),
    normal: wrap(new THREE.CanvasTexture(normalCanvas), THREE.NoColorSpace)
  }
}

/**
 * Neutral / slightly cool daylight studio IBL (no amber wash).
 * Softboxes stay soft for clearcoat glints without jaundice on ivory/metal.
 */
function createStudioEnvironment(): THREE.Scene {
  const studio = new THREE.Scene()
  const skyCanvas = document.createElement('canvas')
  skyCanvas.width = 4
  skyCanvas.height = 64
  const skyCtx = skyCanvas.getContext('2d')
  if (skyCtx) {
    const grad = skyCtx.createLinearGradient(0, 0, 0, 64)
    grad.addColorStop(0, '#a8b8c8')
    grad.addColorStop(0.32, '#d8dde4')
    grad.addColorStop(0.58, '#c4c8d0')
    grad.addColorStop(1, '#1a1c22')
    skyCtx.fillStyle = grad
    skyCtx.fillRect(0, 0, 4, 64)
  }
  const skyMap = new THREE.CanvasTexture(skyCanvas)
  skyMap.colorSpace = THREE.SRGBColorSpace
  const room = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 16),
    new THREE.MeshBasicMaterial({ map: skyMap, side: THREE.BackSide })
  )
  room.scale.set(14, 10, 14)
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
  // Ceiling wash + key / fill / rim — cool daylight neutrals (no amber / jaundice).
  panel(0xeef2f8, 42, new THREE.Vector3(0, 8.5, 0), new THREE.Vector3(9, 0.12, 9))
  panel(0xe8eef8, 34, new THREE.Vector3(-6.5, 6, 5), new THREE.Vector3(3.2, 2.6, 0.1))
  panel(0xb8cae0, 28, new THREE.Vector3(7, 4.5, -3.5), new THREE.Vector3(2.6, 2.2, 0.1))
  panel(0xdce4f0, 24, new THREE.Vector3(1, 3.2, -8), new THREE.Vector3(5.5, 1.5, 0.1))
  panel(0x1e2028, 5, new THREE.Vector3(0, -5.5, 0), new THREE.Vector3(12, 0.2, 12))
  return studio
}

function attachStudioIbl(renderer: THREE.WebGLRenderer, scene: THREE.Scene): () => void {
  try {
    const pmrem = new THREE.PMREMGenerator(renderer)
    const studio = createStudioEnvironment()
    const env = pmrem.fromScene(studio, 0.03)
    scene.environment = env.texture
    scene.environmentIntensity = 0.68
    studio.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const material of materials) {
          const mapped = material as THREE.MeshBasicMaterial
          if (mapped.map) mapped.map.dispose()
          material.dispose()
        }
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

function disposeMaterialMaps(material: THREE.Material, shared?: Set<THREE.Texture>): void {
  const physical = material as THREE.MeshPhysicalMaterial
  const seen = new Set<THREE.Texture>()
  for (const key of [
    'map',
    'normalMap',
    'roughnessMap',
    'bumpMap',
    'clearcoatNormalMap',
    'transmissionMap'
  ] as const) {
    const texture = physical[key]
    if (!(texture instanceof THREE.Texture) || seen.has(texture) || shared?.has(texture)) continue
    seen.add(texture)
    texture.dispose()
  }
  material.dispose()
}

function contactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const glow = ctx.createRadialGradient(64, 64, 6, 64, 64, 62)
    glow.addColorStop(0, 'rgba(0, 0, 0, 0.55)')
    glow.addColorStop(0.45, 'rgba(0, 0, 0, 0.22)')
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
  look: DiceLookPreset,
  orient: (mesh: THREE.Mesh) => void
): void {
  const maps = faceMaps(
    label,
    spec.sides,
    {
      dropped: Boolean(spec.dropped),
      highlight: highlightFor(spec, label)
    },
    look
  )
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshPhysicalMaterial({
      map: maps.map,
      normalMap: maps.normalMap,
      normalScale: new THREE.Vector2(1.05, 1.05),
      roughness: Math.min(0.5, look.roughness + 0.05),
      metalness: Math.min(look.metalness, 0.15),
      clearcoat: spec.dropped ? 0.12 : Math.min(look.clearcoat * 0.95, 0.92),
      clearcoatRoughness: Math.max(0.08, look.clearcoatRoughness * 0.75),
      envMapIntensity: look.envMapIntensity * 0.7,
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
  grain: { albedo: THREE.CanvasTexture; data: THREE.CanvasTexture; normal: THREE.CanvasTexture },
  look: DiceLookPreset
): { group: THREE.Group; spinner: THREE.Group; result: DieFace; faces: DieFace[]; scale: number } {
  const group = new THREE.Group()
  const spinner = new THREE.Group()
  const geometry = dieGeometry(spec)
  const labels = faceLabels(spec)
  const faces = extractDieFaces(geometry, labels)
  const result = resultDieFace(faces, spec)
  const scale = dieBodyScale(spec.sides)
  const mat = dieBodyMaterialInputs(look, spec.dropped)
  const nScale = dieBodyNormalScale(look)
  const body = new THREE.Mesh(
    geometry,
    new THREE.MeshPhysicalMaterial({
      color: mat.color,
      map: grain.albedo,
      roughness: mat.roughness,
      roughnessMap: grain.data,
      normalMap: grain.normal,
      normalScale: new THREE.Vector2(nScale, nScale),
      clearcoatNormalMap: grain.normal,
      clearcoatNormalScale: new THREE.Vector2(nScale * 0.7, nScale * 0.7),
      metalness: mat.metalness,
      clearcoat: mat.clearcoat,
      clearcoatRoughness: mat.clearcoatRoughness,
      sheen: mat.sheen,
      sheenColor: new THREE.Color(mat.sheenColor),
      sheenRoughness: mat.sheenRoughness,
      ior: mat.ior,
      transmission: mat.transmission,
      thickness: mat.thickness,
      attenuationColor: new THREE.Color(mat.attenuationColor),
      attenuationDistance: mat.attenuationDistance > 0 ? mat.attenuationDistance : Infinity,
      specularIntensity: mat.specularIntensity,
      envMapIntensity: mat.envMapIntensity,
      vertexColors: Boolean(geometry.getAttribute('color')),
      transparent: mat.transparent,
      opacity: mat.opacity
    })
  )
  spinner.scale.setScalar(scale)
  spinner.add(body)
  if (spec.sides <= 4) {
    for (const mark of d4CornerMarks(faces)) {
      const toward = mark.vertex.clone().sub(mark.face.center)
      const pos = mark.face.center.clone().addScaledVector(toward, 0.58)
      addFaceDecal(spinner, pos, mark.face.normal, mark.label, mark.face.size * 0.4, spec, look, (mesh) =>
        orientD4CornerDecal(mesh, mark.face.normal, toward)
      )
    }
  } else {
    for (const face of faces) {
      addFaceDecal(spinner, face.center, face.normal, face.label, face.size, spec, look, (mesh) =>
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
  renderer.toneMapping = THREE.NeutralToneMapping
  // Cool daylight exposure — Neutral TM avoids ACES midtone jaundice.
  renderer.toneMappingExposure = 1.08

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80)
  camera.position.copy(DICE_3D_CAMERA_POSITION)
  camera.lookAt(DICE_3D_LOOK_AT)

  const disposeIbl = attachStudioIbl(renderer, scene)
  // Cool daylight key / fill / rim — ivory reads cream, metals stay steel-grey.
  scene.add(new THREE.HemisphereLight(0xe4ecf6, 0x161820, 0.36))
  const key = new THREE.DirectionalLight(0xeef2f8, 0.92)
  key.position.set(-5, 13, 9)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xa8bce0, 0.52)
  fill.position.set(8, 5, -4)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xd0dcec, 0.55)
  rim.position.set(2, 4, -10)
  scene.add(rim)

  const look = resolveDiceLook(opts.lookPreset)
  const feltWidth = 14
  const feltDepth = 8
  const usable = 1 - reservedRight
  const stageShift = feltWidth * (0.5 - usable / 2)
  const grain = resinGrainTextures(look)
  const sharedMaps = new Set<THREE.Texture>([grain.albedo, grain.data, grain.normal])
  const ends = landingGrid(dice.length, feltWidth * 0.62, feltDepth * 0.7).map(
    (spot) => spot.add(new THREE.Vector3(-stageShift, 0, 0))
  )
  const motions = planDieThrowMotions(dice)
  const flyers: FlyingDie[] = dice.map((spec, index) => {
    const made = makeDie(spec, grain, look)
    const end = ends[index] ?? new THREE.Vector3()
    const motion = motions[index]!
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
    const spinBoost = motion.flair === 'nat20' ? 1.55 : motion.flair === 'nat1' ? 0.55 : 1
    return {
      group: made.group,
      spinner: made.spinner,
      bodyScale: made.scale,
      start,
      end,
      startQuat,
      endQuat,
      spin: new THREE.Euler(
        Math.PI * (2.2 + Math.random() * 1.6) * spinBoost,
        Math.PI * (1.6 + Math.random() * 1.8) * spinBoost,
        Math.PI * (0.8 + Math.random() * 1.2) * spinBoost
      ),
      motion
    }
  })

  const extraSpin = new THREE.Quaternion()
  const wobbleQ = new THREE.Quaternion()
  const spinEuler = new THREE.Euler()
  const wobbleEuler = new THREE.Euler()
  const scratch = new THREE.Quaternion()
  const baseExposure = 1.08
  const baseFov = camera.fov
  const baseCamPos = camera.position.clone()
  const punchLook = DICE_3D_LOOK_AT.clone()
  const punchCam = new THREE.Vector3()
  const punchTarget = new THREE.Vector3()
  renderer.toneMappingExposure = baseExposure

  // Gold / blood flash light — intensity driven by flair envelopes (TV-readable, not neon spam).
  const flairLight = new THREE.PointLight(0xffe2a0, 0, 22, 1.6)
  flairLight.position.set(0, 4, 2)
  scene.add(flairLight)
  const flairFill = new THREE.DirectionalLight(0xffe2a0, 0)
  flairFill.position.set(-2, 10, 6)
  scene.add(flairFill)

  const flairFlyer =
    flyers.find((flyer) => flyer.motion.flair === 'nat20' || flyer.motion.flair === 'nat1') ?? null

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
    let glow = 0
    let shade = 0
    let punch = 0
    for (const flyer of flyers) {
      const sample = sampleDieThrow(t, flyer.motion)
      glow = Math.max(glow, sample.glow)
      shade = Math.max(shade, sample.shade)
      punch = Math.max(punch, sample.cameraPunch)
      flyer.group.position.lerpVectors(flyer.start, flyer.end, sample.planar)
      flyer.group.position.y =
        flyer.start.y + (flyer.end.y - flyer.start.y) * sample.planar + sample.height
      flyer.spinner.scale.setScalar(flyer.bodyScale * sample.scale)
      flyer.spinner.quaternion.copy(flyer.startQuat).slerp(flyer.endQuat, sample.orient)
      spinEuler.set(flyer.spin.x * sample.spin, flyer.spin.y * sample.spin, flyer.spin.z * sample.spin)
      extraSpin.setFromEuler(spinEuler)
      wobbleEuler.set(sample.wobbleX, sample.wobbleY, sample.wobbleZ)
      wobbleQ.setFromEuler(wobbleEuler)
      scratch.copy(flyer.spinner.quaternion).multiply(extraSpin).multiply(wobbleQ)
      flyer.spinner.quaternion.copy(scratch)
    }

    if (glow >= shade && glow > 0.01) {
      flairLight.color.setHex(0xffe4a8)
      flairFill.color.setHex(0xffd78a)
      flairLight.intensity = glow * 14
      flairFill.intensity = glow * 1.35
    } else if (shade > 0.01) {
      flairLight.color.setHex(0x9a1820)
      flairFill.color.setHex(0x6a1018)
      flairLight.intensity = shade * 11
      flairFill.intensity = shade * 1.05
    } else {
      flairLight.intensity = 0
      flairFill.intensity = 0
    }
    if (flairFlyer) {
      flairLight.position.set(flairFlyer.end.x, flairFlyer.end.y + 2.8, flairFlyer.end.z + 1.2)
    }

    // Warm gold lift / blood darken + camera punch toward the crit/fail die.
    renderer.toneMappingExposure = baseExposure + glow * 0.55 - shade * 0.42
    if (flairFlyer && punch > 0.01) {
      punchLook.set(
        DICE_3D_LOOK_AT.x * (1 - punch * 0.55) + flairFlyer.end.x * punch * 0.55,
        DICE_3D_LOOK_AT.y + punch * 0.35,
        DICE_3D_LOOK_AT.z * (1 - punch * 0.55) + flairFlyer.end.z * punch * 0.55
      )
      punchTarget.set(
        flairFlyer.end.x * 0.35 + baseCamPos.x * 0.65,
        baseCamPos.y - punch * 1.4,
        baseCamPos.z - punch * 2.8
      )
      punchCam.copy(baseCamPos).lerp(punchTarget, punch * 0.85)
      camera.position.copy(punchCam)
      camera.fov = baseFov - punch * 5.5
      camera.lookAt(punchLook)
      camera.updateProjectionMatrix()
    } else {
      camera.position.copy(baseCamPos)
      camera.fov = baseFov
      camera.lookAt(DICE_3D_LOOK_AT)
      camera.updateProjectionMatrix()
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
      grain.albedo.dispose()
      grain.data.dispose()
      grain.normal.dispose()
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose()
        }
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Sprite) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
          for (const material of materials) disposeMaterialMaps(material, sharedMaps)
        }
      })
    }
  }
}
