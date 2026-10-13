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
