import { describe, expect, it } from 'vitest'
import cannae from '../data/scenarios/cannae.json'
import {
  parseScenario,
  scenarioSchema,
  type ParseResult,
  type Scenario,
} from './scenario'

const base = scenarioSchema.parse(cannae)

function withChange(change: (s: Scenario) => void): ParseResult {
  const s = structuredClone(base)
  change(s)
  return parseScenario(s)
}

function expectError(result: ParseResult, text: string) {
  expect(result.ok).toBe(false)
  if (!result.ok) expect(result.error).toContain(text)
}

describe('scenario schema', () => {
  it('accepts the Cannae stub', () => {
    expect(parseScenario(cannae).ok).toBe(true)
  })

  it('rejects duplicate unit ids', () => {
    expectError(
      withChange((s) => {
        s.units[1]!.id = s.units[0]!.id
      }),
      'Duplicate id',
    )
  })

  it('rejects unknown sides', () => {
    expectError(
      withChange((s) => {
        s.units[0]!.sideId = 'gauls'
      }),
      'Unknown side',
    )
  })

  it('rejects keyframes out of order', () => {
    expectError(
      withChange((s) => {
        s.units[0]!.keyframes[1]!.t = 0
      }),
      'Keyframe times must increase',
    )
  })

  it('rejects a terminal state before the last keyframe', () => {
    expectError(
      withChange((s) => {
        s.units[0]!.keyframes[0]!.state = 'destroyed'
      }),
      'must be the last keyframe',
    )
  })

  it('rejects estimates outside their range', () => {
    expectError(
      withChange((s) => {
        s.units[0]!.initialStrength.min = 999999
      }),
      'min <= best <= max',
    )
  })

  it('rejects losses larger than initial strength', () => {
    expectError(
      withChange((s) => {
        s.units[0]!.losses = { best: 999999, sourceIds: [] }
      }),
      'Losses exceed initial strength',
    )
  })

  it('rejects year 0', () => {
    expectError(
      withChange((s) => {
        s.date.year = 0
      }),
      'no year 0',
    )
  })

  it('only lets commanders lead units', () => {
    expectError(
      withChange((s) => {
        s.units[0]!.leadsUnitIds = ['carthaginian-centre']
      }),
      'Only commanders',
    )
  })

  it('rejects unknown sources', () => {
    expectError(
      withChange((s) => {
        s.events[0]!.sourceIds = ['tacitus']
      }),
      'Unknown source',
    )
  })
})
