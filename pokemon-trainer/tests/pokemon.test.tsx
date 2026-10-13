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

const sized = (bodyColumns: number, maxRows: number) => ({
  ...band(false),
  props: { ...band(false).props, bodyColumns, maxRows },
  surface: 'terminal' as const,
})

test('the session opens on the logo alone, which clears itself and shows the battle menu', async ($, on) => {
  mock.store(on)
  const clock = mock.clock(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  // the session started long before the first draw: the logo still waits for it
  await clock.advance(10_000)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...band(false), surface })
    expect(await ui.find({ key: 'logo' }) ?? await ui.find({ type: 'Svg' })).toBeDefined()
    expect(await ui.find({ text: /모험을 시작하자/ })).toBeUndefined()
    expect(await ui.find({ text: /무엇을 할까/ })).toBeUndefined()
    await ui.unmount()
  }
  await clock.advance(3000)
  const ui = await $.ui.mount({ ...band(false), surface: 'terminal' })
  expect(await ui.find({ text: /무엇을 할까/ })).toBeDefined()
})

test('the logo takes the largest size the band has room for', async ($, on) => {
  mock.store(on)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const logoColumns = async (columns: number, rows: number) => {
    const ui = await $.ui.mount(sized(columns, rows))
    const found = await ui.find({ key: 'logo' })
    await ui.unmount()

    return found?.props.columns
  }
  expect(await logoColumns(120, 20)).toBe(80)
  expect(await logoColumns(120, 12)).toBe(60)
  expect(await logoColumns(70, 9)).toBe(44)
  expect(await logoColumns(70, 6)).toBeUndefined()
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

test('zooming in keeps the full Pikachu and sheds the menu and the bar text first', async ($, on) => {
  on('session.measure', (_, e) => ({ changed: e.changed }))
  await $.session.measure({
    context: { window: 200000, tokens: 144000, percent: 72 },
    rateLimits: [],
    changed: ['context'],
  })
  const drawn = async (bodyColumns: number, maxRows: number) => {
    const ui = await $.ui.mount(sized(bodyColumns, maxRows))
    const found = {
      pikachu: (await ui.find({ key: 'pikachu' })) !== undefined,
      menu: (await ui.find({ text: /싸운다/ })) !== undefined,
      tokens: (await ui.find({ text: /56k\/200k/ })) !== undefined,
    }
    await ui.unmount()

    return found
  }
  expect(await drawn(100, 20)).toEqual({ pikachu: true, menu: true, tokens: true })
  expect(await drawn(70, 20)).toEqual({ pikachu: true, menu: false, tokens: true })
  expect(await drawn(54, 20)).toEqual({ pikachu: true, menu: false, tokens: false })
  expect(await drawn(46, 20)).toEqual({ pikachu: true, menu: false, tokens: false })
  expect(await drawn(45, 20)).toEqual({ pikachu: false, menu: false, tokens: false })
  expect(await drawn(80, 8)).toEqual({ pikachu: false, menu: true, tokens: true })
})
