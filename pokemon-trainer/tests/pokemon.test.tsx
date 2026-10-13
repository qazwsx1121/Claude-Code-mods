import { expect, mock, test } from 'claude-code/testing'

const PLUGIN = 'pokemon-trainer'
const SURFACES = ['terminal', 'desktop'] as const

const band = (isWorking: boolean) =>
  ({
    plugin: PLUGIN,
    component: 'AbovePrompt',
    props: {
      hasSurvey: false,
      isWorking,
      maxRows: 20,
      bodyColumns: 90,
      scroll: { offset: 0, bodyRows: 20 },
      view: {},
    },
  }) as const

const turn = (id: string) =>
  ({ answer: '', durationMs: 1000, isAborted: false, turnId: id, reason: 'answer' }) as const

test('the battle band asks what the trainer will do', async $ => {
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...band(false), surface })
    expect(await ui.find({ text: /무엇을 할까/ })).toBeDefined()
    expect(await ui.find({ text: /싸운다/ })).toBeDefined()
    expect(await ui.find({ text: /HP/ })).toBeDefined()
    await ui.unmount()
  }
})

test('a tool call becomes the move the band announces', async ($, on) => {
  on('tool.call', () => ({ result: 'ok' }))
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...band(true), surface })
    expect(await ui.find({ text: /10만볼트/ })).toBeDefined()
    await ui.unmount()
  }
})

test('the HP bar shows how much of the context window is left', async ($, on) => {
  on('session.measure', (_, e) => ({ changed: e.changed }))
  await $.session.measure({
    context: { window: 200000, tokens: 144000, percent: 72 },
    rateLimits: [],
    changed: ['context'],
  })
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...band(false), surface })
    expect(await ui.find({ text: /28% 56k\/200k/ })).toBeDefined()
    await ui.unmount()
  }
})

test("the person's prompt is drawn in a trainer dialogue box", async $ => {
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({
      plugin: PLUGIN,
      surface,
      component: 'UserMessage',
      props: { text: '버그 잡아줘', origin: { kind: 'composer' }, isExpanded: false },
    })
    expect(await ui.find({ text: /트레이너/ })).toBeDefined()
    expect(await ui.find({ text: /버그 잡아줘/ })).toBeDefined()
    await ui.unmount()
  }
})

test('/pokemon turns the look off and the engine draws again', async ($, on) => {
  mock.store(on)
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine band</Text>
  })
  const { text } = await $.command.run({
    command: 'pokemon',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 90 },
  })
  expect(text).toMatch(/OFF/)
  const ui = await $.ui.mount({ ...band(false), surface: 'terminal' })
  expect(await ui.find({ text: /engine band/ })).toBeDefined()
})

test('the session opens on the Pokémon logo, then the battle menu', async ($, on) => {
  mock.store(on)
  const clock = mock.clock(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...band(false), surface })
    expect(await ui.find({ text: /모험을 시작하자/ })).toBeDefined()
    await ui.unmount()
  }
  await clock.advance(4000)
  const ui = await $.ui.mount({ ...band(false), surface: 'terminal' })
  expect(await ui.find({ text: /무엇을 할까/ })).toBeDefined()
})

test('a finished answer plays the report jingle, and /pokemon sound mutes it', async ($, on) => {
  mock.store(on)
  const clock = mock.clock(on)
  const played: unknown[] = []
  on('audio.play', (_, e) => {
    played.push(e.clip)

    return { value: undefined }
  })
  on('turn.complete', () => ({ text: '' }))
  await $.turn.complete(turn('t1'))
  await clock.advance(0)
  expect(played).toEqual([{ asset: 'sounds/report.wav' }])

  await $.command.run({
    command: 'pokemon',
    args: 'sound',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 90 },
  })
  await $.turn.complete(turn('t2'))
  await clock.advance(0)
  expect(played).toHaveLength(1)
})

test('shrinking the terminal swaps Pikachu for a smaller one before dropping it', async $ => {
  const sized = (bodyColumns: number, maxRows: number) => ({
    ...band(false),
    props: { ...band(false).props, bodyColumns, maxRows },
    surface: 'terminal' as const,
  })
  const sprites = async (bodyColumns: number, maxRows: number) => {
    const ui = await $.ui.mount(sized(bodyColumns, maxRows))
    const found = {
      large: (await ui.find({ key: 'pikachu' })) !== undefined,
      small: (await ui.find({ key: 'pikachu-small' })) !== undefined,
      menu: (await ui.find({ text: /싸운다/ })) !== undefined,
    }
    await ui.unmount()

    return found
  }
  expect(await sprites(100, 20)).toEqual({ large: true, small: false, menu: true })
  expect(await sprites(70, 20)).toEqual({ large: true, small: false, menu: false })
  expect(await sprites(80, 8)).toEqual({ large: false, small: true, menu: true })
  expect(await sprites(54, 8)).toEqual({ large: false, small: true, menu: false })
  expect(await sprites(45, 8)).toEqual({ large: false, small: false, menu: false })
})
