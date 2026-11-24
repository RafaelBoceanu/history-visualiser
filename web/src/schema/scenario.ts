import { z } from 'zod'

const id = z
  .string()
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    'IDs use lowercase letters, digits and single hyphens',
  )

const text = z.string().min(1)

/** A value historians disagree on: a best estimate with an optional range. */
export const estimateSchema = z
  .object({
    min: z.number().nonnegative().optional(),
    best: z.number().nonnegative(),
    max: z.number().nonnegative().optional(),
    sourceIds: z.array(id),
  })
  .refine((v) => (v.min ?? v.best) <= v.best && v.best <= (v.max ?? v.best), {
    message: 'Estimate must satisfy min <= best <= max',
  })

/** Negative years are BCE. There is no year 0. */
export const historicalDateSchema = z.object({
  year: z
    .number()
    .int()
    .refine((y) => y !== 0, 'There is no year 0: use -1 for 1 BCE'),
  month: z.number().int().min(1).max(12).optional(),
  day: z.number().int().min(1).max(31).optional(),
})

export const unitTypes = [
  'heavy-infantry',
  'light-infantry',
  'heavy-cavalry',
  'light-cavalry',
  'skirmishers',
  'archers',
  'commander',
] as const

export const unitStates = [
  'formed',
  'moving',
  'engaged',
  'routing',
  'destroyed',
  'left',
] as const

const terminalStates: ReadonlySet<string> = new Set(['destroyed', 'left'])

export const landmarkKinds = [
  'river',
  'settlement',
  'camp',
  'hill',
  'other',
] as const

export const sideSchema = z.object({
  id,
  name: text,
  colour: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Colours are hex, like #b03030'),
})

/** Positions are metres east (e) and north (n) of the scenario anchor. */
export const keyframeSchema = z.object({
  t: z.number().nonnegative(),
  e: z.number(),
  n: z.number(),
  facing: z.number().min(0).lt(360),
  width: z.number().positive(),
  depth: z.number().positive(),
  strength: z.number().min(0).max(1),
  state: z.enum(unitStates),
})

export const unitSchema = z.object({
  id,
  sideId: id,
  name: text,
  description: z.string(),
  type: z.enum(unitTypes),
  initialStrength: estimateSchema,
  losses: estimateSchema.optional(),
  leadsUnitIds: z.array(id).optional(),
  sourceIds: z.array(id),
  keyframes: z.array(keyframeSchema).min(1),
})

export const landmarkSchema = z.object({
  id,
  name: text,
  kind: z.enum(landmarkKinds),
  e: z.number(),
  n: z.number(),
  sourceIds: z.array(id),
})

export const eventSchema = z.object({
  id,
  t: z.number().nonnegative(),
  title: text,
  description: z.string(),
  focus: z.object({
    e: z.number(),
    n: z.number(),
    distance: z.number().positive(),
  }),
  unitIds: z.array(id),
  sourceIds: z.array(id),
})

export const sourceSchema = z.object({
  id,
  citation: text,
  url: z.url().optional(),
})

const scenarioObject = z.object({
  schemaVersion: z.literal(1),
  kind: z.literal('battle'),
  id,
  title: text,
  date: historicalDateSchema,
  description: z.string(),
  anchor: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
  terrain: z.object({ id, sizeMetres: z.number().positive() }),
  duration: z.number().positive(),
  sides: z.array(sideSchema).min(2),
  units: z.array(unitSchema),
  landmarks: z.array(landmarkSchema),
  events: z.array(eventSchema),
  sources: z.array(sourceSchema),
})

/** Cross-reference rules that a type check alone cannot express. */
export const scenarioSchema = scenarioObject.superRefine((s, ctx) => {
  const issue = (path: (string | number)[], message: string) =>
    ctx.addIssue({ code: 'custom', path, message })

  const checkUnique = (items: { id: string }[], key: string) => {
    const seen = new Set<string>()
    items.forEach((item, i) => {
      if (seen.has(item.id)) issue([key, i, 'id'], `Duplicate id "${item.id}"`)
      seen.add(item.id)
    })
  }
  checkUnique(s.sides, 'sides')
  checkUnique(s.units, 'units')
  checkUnique(s.landmarks, 'landmarks')
  checkUnique(s.events, 'events')
  checkUnique(s.sources, 'sources')

  const sideIds = new Set(s.sides.map((x) => x.id))
  const sourceIds = new Set(s.sources.map((x) => x.id))
  const unitById = new Map(s.units.map((u) => [u.id, u]))

  const checkSources = (ids: string[], path: (string | number)[]) =>
    ids.forEach((sid, i) => {
      if (!sourceIds.has(sid)) issue([...path, i], `Unknown source "${sid}"`)
    })

  s.units.forEach((u, ui) => {
    const p = ['units', ui]
    if (!sideIds.has(u.sideId))
      issue([...p, 'sideId'], `Unknown side "${u.sideId}"`)
    checkSources(u.sourceIds, [...p, 'sourceIds'])
    checkSources(u.initialStrength.sourceIds, [
      ...p,
      'initialStrength',
      'sourceIds',
    ])

    if (u.losses) {
      checkSources(u.losses.sourceIds, [...p, 'losses', 'sourceIds'])
      if (u.losses.best > u.initialStrength.best)
        issue([...p, 'losses'], 'Losses exceed initial strength')
    }

    if (u.leadsUnitIds) {
      if (u.type !== 'commander')
        issue([...p, 'leadsUnitIds'], 'Only commanders can lead units')
      u.leadsUnitIds.forEach((lid, li) => {
        const led = unitById.get(lid)
        if (!led) issue([...p, 'leadsUnitIds', li], `Unknown unit "${lid}"`)
        else if (led.sideId !== u.sideId)
          issue(
            [...p, 'leadsUnitIds', li],
            `Unit "${lid}" belongs to another side`,
          )
      })
    }

    u.keyframes.forEach((k, ki) => {
      const kp = [...p, 'keyframes', ki]
      const prev = u.keyframes[ki - 1]
      if (prev && k.t <= prev.t)
        issue([...kp, 't'], 'Keyframe times must increase')
      if (k.t > s.duration)
        issue([...kp, 't'], 'Keyframe is after the end of the scenario')
      if (terminalStates.has(k.state) && ki !== u.keyframes.length - 1)
        issue([...kp, 'state'], `"${k.state}" must be the last keyframe`)
    })
  })

  s.landmarks.forEach((l, li) =>
    checkSources(l.sourceIds, ['landmarks', li, 'sourceIds']),
  )

  s.events.forEach((ev, ei) => {
    const p = ['events', ei]
    if (ev.t > s.duration)
      issue([...p, 't'], 'Event is after the end of the scenario')
    ev.unitIds.forEach((uid, i) => {
      if (!unitById.has(uid))
        issue([...p, 'unitIds', i], `Unknown unit "${uid}"`)
    })
    checkSources(ev.sourceIds, [...p, 'sourceIds'])
  })
})

export type Estimate = z.infer<typeof estimateSchema>
export type Keyframe = z.infer<typeof keyframeSchema>
export type Unit = z.infer<typeof unitSchema>
export type UnitType = Unit['type']
export type UnitState = Keyframe['state']
export type Scenario = z.infer<typeof scenarioSchema>

export type ParseResult =
  { ok: true; scenario: Scenario } | { ok: false; error: string }

/** Validate untrusted input (a file, an API response) into a Scenario. */
export function parseScenario(input: unknown): ParseResult {
  const result = scenarioSchema.safeParse(input)
  return result.success
    ? { ok: true, scenario: result.data }
    : { ok: false, error: z.prettifyError(result.error) }
}
