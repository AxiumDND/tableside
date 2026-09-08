import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createD10Geometry, extractDieFaces, landingQuaternion, resultDieFace } from './playerDice3dFaces'

describe('extractDieFaces', () => {
  it('finds six faces on a cube', () => {
    const labels = ['1', '2', '3', '4', '5', '6']
    const faces = extractDieFaces(new THREE.BoxGeometry(1, 1, 1), labels)
    expect(faces).toHaveLength(6)
    expect(faces.map((face) => face.label)).toEqual(labels)
  })

  it('finds twenty faces on an icosahedron', () => {
    const labels = Array.from({ length: 20 }, (_, i) => String(i + 1))
    const faces = extractDieFaces(new THREE.IcosahedronGeometry(1), labels)
    expect(faces).toHaveLength(20)
  })

  it('finds twelve faces on a dodecahedron', () => {
    const labels = Array.from({ length: 12 }, (_, i) => String(i + 1))
    const faces = extractDieFaces(new THREE.DodecahedronGeometry(1), labels)
    expect(faces).toHaveLength(12)
  })

  it('finds ten faces on a d10', () => {
    const labels = Array.from({ length: 10 }, (_, i) => String(i + 1))
    expect(extractDieFaces(createD10Geometry(), labels)).toHaveLength(10)
  })
})

describe('resultDieFace', () => {
  it('picks the labelled result face', () => {
    const faces = extractDieFaces(new THREE.BoxGeometry(1, 1, 1), ['1', '2', '3', '4', '5', '6'])
    expect(resultDieFace(faces, { sides: 6, value: 5, label: '5' }).label).toBe('5')
  })
})

describe('landingQuaternion', () => {
  it('turns the result face toward the camera-up target', () => {
    const up = landingQuaternion(new THREE.Vector3(0, 1, 0), 0)
    const landed = new THREE.Vector3(0, 1, 0).applyQuaternion(up)
    expect(landed.y).toBeGreaterThan(0.99)
  })
})
