import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clamp, num, uuid } from '../src/core/utils.js'

test('clamp keeps values within bounds', () => {
  assert.equal(clamp(5, 0, 10), 5)
  assert.equal(clamp(-5, 0, 10), 0)
  assert.equal(clamp(15, 0, 10), 10)
})

test('clamp returns boundary values unchanged', () => {
  assert.equal(clamp(0, 0, 10), 0)
  assert.equal(clamp(10, 0, 10), 10)
})

test('clamp with inverted bounds resolves to low', () => {
  assert.equal(clamp(5, 10, 0), 10)
})

test('num stays in range and respects decimal places', () => {
  for (let i = 0; i < 200; i++) {
    const v = num(1, 2, 2)
    assert.ok(v >= 1 && v <= 2)
    assert.ok(Math.round(v * 100) / 100 === v)
  }
})

test('num with default dp returns integers', () => {
  for (let i = 0; i < 100; i++) assert.ok(Number.isInteger(num(0, 10)))
})

test('uuid is 10 alphanumeric chars and unique', () => {
  const ids = new Set()
  for (let i = 0; i < 1000; i++) {
    const id = uuid()
    assert.match(id, /^[0-9a-zA-Z]{10}$/)
    ids.add(id)
  }
  assert.equal(ids.size, 1000)
})
