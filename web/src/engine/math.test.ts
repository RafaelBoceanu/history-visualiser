import { describe, expect, it } from 'vitest'
import { clamp01, lerp } from './math'

describe('lerp', () => {
    it('interpolates between values', () => {
        expect(lerp(0, 10, 0.5)).toBe(5)
    })
    it('clamps t to [0, 1]', () => {
        expect(clamp01(-1)).toBe(0)
        expect(clamp01(2)).toBe(1)
    })
})