import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  createD10Geometry,
  extractDieFaces,
  landingQuaternion,
  landingTarget,
  resultDieFace
} from './playerDice3dFaces'
import {
  chamferAmountForFaces,
  createChamferedDieGeometry,
  createDieGeometry,
  orderFaceRing
} from './playerDice3dMeshes'

function triangleCount(geometry: THREE.BufferGeometry): number {
  const index = geometry.getIndex()
  const position = geometry.getAttribute('position')
  return (index ? index.count : position.count) / 3
}

describe('orderFaceRing', () => {
  it('orders a square CCW around +Z', () => {
    const ring = orderFaceRing(
      [
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(-1, -1, 1),
        new THREE.Vector3(-1, 1, 1),
        new THREE.Vector3(1, -1, 1)
      ],
      new THREE.Vector3(0, 0, 1)
    )
    expect(ring).toHaveLength(4)
    const area = ring.reduce((sum, vertex, index) => {
      const next = ring[(index + 1) % ring.length]!
      return sum + vertex.x * next.y - next.x * vertex.y
    }, 0)
    expect(area).toBeGreaterThan(0)
  })
})

describe('createDieGeometry', () => {
  it('keeps a d4 sharp so vertex numbers still match corners', () => {
    const geometry = createDieGeometry({ sides: 4 })
    const faces = extractDieFaces(geometry, ['1', '2', '3', '4'])
    expect(faces).toHaveLength(4)
    for (const face of faces) expect(face.vertices).toHaveLength(3)
    expect(geometry.getAttribute('color')).toBeUndefined()
  })

  it('chamfers a d6 and still reads six axis faces', () => {
    const box = new THREE.BoxGeometry(1.28, 1.28, 1.28)
    expect(triangleCount(createDieGeometry({ sides: 6 }))).toBeGreaterThan(triangleCount(box))
    box.dispose()
    const faces = extractDieFaces(createDieGeometry({ sides: 6 }), ['1', '2', '3', '4', '5', '6'])
    expect(faces).toHaveLength(6)
    for (const face of faces) {
      const axis = Math.max(Math.abs(face.normal.x), Math.abs(face.normal.y), Math.abs(face.normal.z))
      expect(axis).toBeGreaterThan(0.98)
      expect(face.normal.dot(face.center)).toBeGreaterThan(0.2)
    }
  })

  it('still lands a chamfered 6 toward the camera', () => {
    const faces = extractDieFaces(createDieGeometry({ sides: 6 }), ['1', '2', '3', '4', '5', '6'])
    const result = resultDieFace(faces, { sides: 6, value: 6, label: '6' })
    const toward = result.normal.clone().applyQuaternion(landingQuaternion(result.normal))
    expect(toward.dot(landingTarget())).toBeGreaterThan(0.999)
  })

  it('keeps chamfered d10 00 opposite 50', () => {
    const labels = ['00', '10', '20', '30', '40', '50', '60', '70', '80', '90']
    const faces = extractDieFaces(createDieGeometry({ sides: 10, faceSet: 'd10-tens' }), labels)
    expect(faces).toHaveLength(10)
    const tens = resultDieFace(faces, { sides: 10, value: 0, label: '00', faceSet: 'd10-tens' })
    const fifty = resultDieFace(faces, { sides: 10, value: 50, label: '50', faceSet: 'd10-tens' })
    expect(tens.normal.dot(fifty.normal)).toBeLessThan(-0.8)
  })

  it('chamfers d8 d12 and d20 without losing faces', () => {
    expect(extractDieFaces(createDieGeometry({ sides: 8 }), ['1', '2', '3', '4', '5', '6', '7', '8'])).toHaveLength(8)
    expect(
      extractDieFaces(
        createDieGeometry({ sides: 12 }),
        Array.from({ length: 12 }, (_, i) => String(i + 1))
      )
    ).toHaveLength(12)
    expect(
      extractDieFaces(
        createDieGeometry({ sides: 20 }),
        Array.from({ length: 20 }, (_, i) => String(i + 1))
      )
    ).toHaveLength(20)
  })

  it('picks a chamfer smaller than the reading face', () => {
    const faces = extractDieFaces(createD10Geometry(), ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'])
    const amount = chamferAmountForFaces(faces)
    const chamfered = createChamferedDieGeometry(faces, amount)
    expect(chamfered.getAttribute('color')).toBeTruthy()
    expect(amount).toBeGreaterThan(0.05)
    expect(amount).toBeLessThan(0.2)
    chamfered.dispose()
  })
})
