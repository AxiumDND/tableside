import * as THREE from 'three'
import {
  DICE_3D_RESERVED_RIGHT,
  DICE_3D_THROW_MS,
  type PlayerDice3dDie
} from '../../../shared/playerDice3d'
import {
  createD10Geometry,
  extractDieFaces,
  faceLabels,
  landingQuaternion,
  resultDieFace,
  type DieFace
} from './playerDice3dFaces'

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
  opts: { dropped: boolean; highlight: 'none' | 'nat20' | 'nat1'; fill: boolean }
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, 256, 256)
    if (opts.fill) {
      ctx.fillStyle = opts.dropped ? '#2a2418' : '#2c1c0c'
      ctx.fillRect(0, 0, 256, 256)
    }
    ctx.fillStyle = opts.dropped
      ? 'rgba(196, 165, 116, 0.55)'
      : opts.highlight === 'nat20'
        ? '#9ed49b'
        : opts.highlight === 'nat1'
          ? '#e08989'
          : '#f4e6c3'
    const size = label.length > 1 ? 108 : 132
    ctx.font = `700 ${size}px Georgia, "Times New Roman", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
    ctx.shadowBlur = 12
    ctx.fillText(label, 128, 140)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function highlightFor(spec: PlayerDice3dDie, label: string): 'none' | 'nat20' | 'nat1' {
  if (spec.dropped || spec.sides !== 20 || label !== spec.label) return 'none'
  if (spec.value === 20) return 'nat20'
  if (spec.value === 1) return 'nat1'
  return 'none'
}

function orientFaceDecal(mesh: THREE.Mesh, normal: THREE.Vector3): void {
  const z = new THREE.Vector3(0, 0, 1)
  mesh.quaternion.setFromUnitVectors(z, normal.clone().normalize())
  const landing = new THREE.Quaternion().setFromUnitVectors(normal.clone().normalize(), new THREE.Vector3(0, 1, 0))
  const after = new THREE.Vector3(0, 1, 0).applyQuaternion(mesh.quaternion).applyQuaternion(landing)
  const current = Math.atan2(after.x, after.z)
  const desired = Math.atan2(0, -1)
  mesh.rotateOnAxis(z, desired - current)
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

function makeDie(spec: PlayerDice3dDie): { group: THREE.Group; spinner: THREE.Group; result: DieFace } {
  const group = new THREE.Group()
  const spinner = new THREE.Group()
  const geometry = dieGeometry(spec.sides)
  const labels = faceLabels(spec)
  const faces = extractDieFaces(geometry, labels)
  const cube = spec.sides === 6
  const result = resultDieFace(faces, spec)
  const body = new THREE.Mesh(
    geometry,
    cube
      ? faces.map(
          (face) =>
            new THREE.MeshStandardMaterial({
              map: faceTexture(face.label, {
                dropped: Boolean(spec.dropped),
                highlight: highlightFor(spec, face.label),
                fill: true
              }),
              roughness: 0.46,
              metalness: 0.22,
              transparent: Boolean(spec.dropped),
              opacity: spec.dropped ? 0.58 : 1
            })
        )
      : new THREE.MeshStandardMaterial({
          color: spec.dropped ? 0x2a2418 : 0x2c1c0c,
          roughness: 0.42,
          metalness: 0.28,
          emissive: 0x140e08,
          emissiveIntensity: 0.12,
          transparent: Boolean(spec.dropped),
          opacity: spec.dropped ? 0.55 : 1
        })
  )
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry, 18),
    new THREE.LineBasicMaterial({
      color: spec.dropped ? 0x7a6848 : 0xe0c27a,
      transparent: true,
      opacity: spec.dropped ? 0.4 : 0.92
    })
  )
  spinner.add(body, edges)
  if (!cube) {
    for (const face of faces) {
      const decal = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          map: faceTexture(face.label, {
            dropped: Boolean(spec.dropped),
            highlight: highlightFor(spec, face.label),
            fill: false
          }),
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1
        })
      )
      decal.position.copy(face.center).addScaledVector(face.normal, 0.035)
      orientFaceDecal(decal, face.normal)
      decal.scale.setScalar(face.size)
      spinner.add(decal)
    }
  }
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -0.72
  group.add(spinner, shadow)
  return { group, spinner, result }
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

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80)
  camera.position.set(-1.2, 9.4, 12.6)
  camera.lookAt(-1.4, 0.2, 0)

  scene.add(new THREE.AmbientLight(0xf0e2c4, 0.7))
  const key = new THREE.DirectionalLight(0xffe6b0, 1.15)
  key.position.set(-6, 12, 8)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0x8eb4ff, 0.28)
  fill.position.set(8, 4, -6)
  scene.add(fill)

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
    const endQuat = landingQuaternion(made.result.normal)
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
