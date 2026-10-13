import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Hp } from '../types'
import { PIKACHU_COLUMNS, PIKACHU_ROWS, PIKACHU_SVG, pikachuCells } from './art'

const isOn = atom({ plugin: 'pokemon-trainer', key: 'isOn' } as const, true)
const move = atom({ plugin: 'pokemon-trainer', key: 'move' } as const, null)
const hp = atom({ plugin: 'pokemon-trainer', key: 'hp' } as const, null)

const YELLOW = '#ffcb05'
const BLUE = '#3b4cca'
const RED = '#ee1515'
const HP_GREEN = '#40d060'
const HP_YELLOW = '#f8c800'
const HP_RED = '#f04030'

const PIKACHU_CELLS = pikachuCells()
const HP_BAR_WIDTH = 12
const MENU_WIDTH = 24

const MOVES: Record<string, string> = {
  Bash: '10만볼트',
  Read: '사이코키네시스',
  Grep: '전광석화',
  Glob: '전광석화',
  Edit: '잎날가르기',
  MultiEdit: '잎날가르기',
  NotebookEdit: '잎날가르기',
  Write: '솔라빔',
  WebSearch: '파도타기',
  WebFetch: '파도타기',
  Agent: '그림자분신',
  Task: '그림자분신',
  TodoWrite: '명상',
}
const REPLY_MOVES = ['10만볼트', '화염방사', '파도타기', '파괴광선', '전광석화']

function formatTokens(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`
}

/** The HP bar of what is left of the context window: green, then yellow, then red. */
function hpBar(value: Hp | null): { full: string; empty: string; color: string; label: string } {
  if (value === null || value.window <= 0) {
    return { full: '▰'.repeat(HP_BAR_WIDTH), empty: '', color: HP_GREEN, label: '--/--' }
  }
  const left = Math.max(0, value.window - value.tokens)
  const ratio = left / value.window
  const filled = Math.min(HP_BAR_WIDTH, Math.max(left > 0 ? 1 : 0, Math.round(ratio * HP_BAR_WIDTH)))
  const color = ratio > 0.5 ? HP_GREEN : ratio > 0.2 ? HP_YELLOW : HP_RED

  return {
    full: '▰'.repeat(filled),
    empty: '▱'.repeat(HP_BAR_WIDTH - filled),
    color,
    label: `${Math.round(ratio * 100)}% ${formatTokens(left)}/${formatTokens(value.window)}`,
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000))
  if (seconds < 60) return `${seconds}s`

  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

function pickMove(seed: string): string {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0

  return REPLY_MOVES[Math.abs(hash) % REPLY_MOVES.length] ?? '몸통박치기'
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const savedOn = await $.store.get('isOn')
    if (typeof savedOn === 'boolean') await update($, isOn, () => savedOn)
    await $.command.register({
      name: 'pokemon',
      description: '포켓몬 배틀 화면을 켜고 끕니다',
    })

    return next(e)
  })

  on('command.run', { command: 'pokemon' }, async $ => {
    const now = !(await read($, isOn))
    await update($, isOn, () => now)
    await $.store.set('isOn', now)

    return {
      text: now
        ? '포켓몬 배틀 화면 ON! 입력창 테두리 색까지 바꾸려면 /theme 에서 "Pokémon (Pikachu)"를 고르세요.'
        : '포켓몬 배틀 화면 OFF. /pokemon 으로 다시 켤 수 있어요.',
    }
  })

  on('tool.call', async ($, e, next) => {
    await update($, move, () => MOVES[String(e.tool)] ?? '몸통박치기')

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    const { tokens, window } = e.context
    if (tokens !== undefined && window > 0) await update($, hp, () => ({ tokens, window }))

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) await update($, move, () => null)

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !(await read($, isOn))) return next(e)
    if (e.surface !== 'terminal' && e.surface !== 'desktop') return next(e)

    const current = await read($, move)
    const bar = hpBar(await read($, hp))
    const columns = e.props.bodyColumns
    const isWorking = e.props.isWorking
    const { Box, Text } = $.ui.resolve(e)

    const message = isWorking ? (
      <Text wrap="truncate">
        <Text bold color={RED}>CLAUDE</Text>의{' '}
        <Text bold color={YELLOW}>{current ?? '명상'}</Text>!
      </Text>
    ) : (
      <Text wrap="truncate">▶ 트레이너는 무엇을 할까?</Text>
    )
    const status = (
      <Text wrap="truncate">
        <Text bold color={RED}>CLAUDE</Text> <Text bold color={YELLOW}>HP</Text>{' '}
        <Text color={bar.color}>{bar.full}</Text>
        <Text dimColor>{bar.empty}</Text> {bar.label}
      </Text>
    )

    if (e.props.maxRows < 6 || columns < 40) {
      return (
        <Box>
          <Text color={RED}>◓ </Text>
          {message}
          <Text>{'  '}</Text>
          {status}
        </Box>
      )
    }

    let sprite
    if (e.surface === 'terminal') {
      const { Raster } = $.ui.resolve(e)
      sprite = <Raster key="pikachu" columns={PIKACHU_COLUMNS} rows={PIKACHU_ROWS} cells={PIKACHU_CELLS} />
    } else {
      const { Svg } = $.ui.resolve(e)
      sprite = <Svg source={PIKACHU_SVG} alt="피카츄" width={64} height={64} />
    }

    return (
      <Box flexDirection="row" gap={1}>
        {columns >= 64 && e.props.maxRows >= PIKACHU_ROWS + 2 && sprite}
        <Box
          flexDirection="column"
          flexGrow={1}
          borderStyle="double"
          borderColor={YELLOW}
          paddingX={1}
        >
          {message}
          <Text> </Text>
          {status}
          <Text dimColor wrap="truncate">
            {isWorking ? 'esc 를 누르면 도망간다' : '기술을 입력하고 Enter!'}
          </Text>
        </Box>
        {columns >= 52 && (
          <Box
            flexDirection="column"
            width={MENU_WIDTH}
            borderStyle="double"
            borderColor={BLUE}
            paddingX={1}
          >
            <Text dimColor={isWorking}>
              <Text color={RED}>▸</Text>싸운다{'    '}가방
            </Text>
            <Text> </Text>
            <Text dimColor={isWorking}> 포켓몬{'    '}도망간다</Text>
            <Text> </Text>
          </Box>
        )}
      </Box>
    )
  })

  on(
    'ui.render',
    { component: 'UserMessage', props: { origin: { kind: 'composer' } } },
    async ($, e, next) => {
      if (!(await read($, isOn))) return next(e)
      const { Box, Text } = $.ui.resolve(e)

      return (
        <Box flexDirection="column">
          <Text>
            <Text bold color="#ffffff" backgroundColor={RED}> ◓ 트레이너 </Text>
          </Text>
          <Box
            borderStyle="round"
            borderColor={YELLOW}
            backgroundColor="userMessageBackground"
            paddingX={1}
          >
            <Text>{e.props.text}</Text>
          </Box>
        </Box>
      )
    },
  )

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.props.isSummary || !(await read($, isOn))) return next(e)
    const { Box, Text, Markdown } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {e.props.isFirstOfReply && (
          <Text>
            <Text bold color="#ffffff" backgroundColor={BLUE}> ◓ CLAUDE </Text>
          </Text>
        )}
        <Box borderStyle="round" borderColor={BLUE} paddingX={1}>
          <Markdown text={e.props.text} />
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (!(await read($, isOn))) return next(e)
    const { mode, word } = e.props
    let name: string
    if (mode === 'thinking') name = '명상'
    else if (mode === 'tool-use' || mode === 'tool-input') name = (await read($, move)) ?? '몸통박치기'
    else if (mode === 'requesting') name = '고속이동'
    else name = pickMove(word)

    return next({ ...e, props: { ...e.props, word: `CLAUDE의 ${name}` } })
  })

  on('ui.render', { component: 'TurnDuration' }, async ($, e, next) => {
    if (!(await read($, isOn))) return next(e)
    const { Text } = $.ui.resolve(e)

    return (
      <Text dimColor>
        <Text color={RED}>◓</Text> 배틀 종료! CLAUDE는 경험치를 얻었다 ({formatDuration(e.props.durationMs)})
      </Text>
    )
  })
}
