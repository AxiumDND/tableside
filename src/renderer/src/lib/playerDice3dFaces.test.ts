import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  createD10Geometry,
  extractDieFaces,
  landingQuaternion,
  landingTarget,
  resultDieFace
} from './playerDice3dFaces'

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

  it('finds four faces on a tetrahedron', () => {
    const labels = ['1', '2', '3', '4']
    expect(extractDieFaces(new THREE.TetrahedronGeometry(1.12), labels)).toHaveLength(4)
  })

  it('points every d10 face outward so 00 is not the same as 50', () => {
    const labels = ['00', '10', '20', '30', '40', '50', '60', '70', '80', '90']
    const faces = extractDieFaces(createD10Geometry(), labels)
    for (const face of faces) {
      expect(face.normal.dot(face.center)).toBeGreaterThan(0.2)
    }
    const tens = resultDieFace(faces, { sides: 10, value: 0, label: '00', faceSet: 'd10-tens' })
    const fifty = resultDieFace(faces, { sides: 10, value: 50, label: '50', faceSet: 'd10-tens' })
    expect(tens.normal.dot(fifty.normal)).toBeLessThan(-0.8)
  })
})

describe('resultDieFace', () => {
  it('picks the labelled result face', () => {
    const faces = extractDieFaces(new THREE.BoxGeometry(1, 1, 1), ['1', '2', '3', '4', '5', '6'])
    expect(resultDieFace(faces, { sides: 6, value: 5, label: '5' }).label).toBe('5')
  })
})

describe('landingQuaternion', () => {
  it('turns the result face fully toward the camera', () => {
    const target = landingTarget()
    expect(target.dot(new THREE.Vector3(0, 1, 0))).toBeLessThan(0.85)
    const landed = new THREE.Vector3(0, 0, 1).applyQuaternion(landingQuaternion(new THREE.Vector3(0, 0, 1)))
    expect(landed.dot(target)).toBeGreaterThan(0.999)
  })

  it('lands a 00 tens face toward the camera, not the opposite 50', () => {
    const labels = ['00', '10', '20', '30', '40', '50', '60', '70', '80', '90']
    const faces = extractDieFaces(createD10Geometry(), labels)
    const result = resultDieFace(faces, { sides: 10, value: 0, label: '00', faceSet: 'd10-tens' })
    const q = landingQuaternion(result.normal)
    const target = landingTarget()
    const toward = (label: string): number =>
      faces.find((face) => face.label === label)!.normal.clone().applyQuaternion(q).dot(target)
    expect(toward('00')).toBeGreaterThan(0.999)
    expect(toward('50')).toBeLessThan(-0.8)
  })
})
