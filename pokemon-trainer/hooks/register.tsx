import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Hp } from '../types'
import { PIKACHU } from './art'
import { LOGOS } from './logo'

const isOn = atom({ plugin: 'pokemon-trainer', key: 'isOn' } as const, true)
const move = atom({ plugin: 'pokemon-trainer', key: 'move' } as const, null)
const hp = atom({ plugin: 'pokemon-trainer', key: 'hp' } as const, null)
const isIntro = atom({ plugin: 'pokemon-trainer', key: 'isIntro' } as const, false)
const isSoundOn = atom({ plugin: 'pokemon-trainer', key: 'isSoundOn' } as const, true)

const YELLOW = '#ffcb05'
const BLUE = '#3b4cca'
const RED = '#ee1515'
const HP_GREEN = '#40d060'
const HP_YELLOW = '#f8c800'
const HP_RED = '#f04030'

const INTRO_MS = 3000
const PIKACHU_BESIDE_MIN = 24
const REPORT_SOUND = 'sounds/report.wav'
const HP_BAR_WIDTH = 12
const HP_BAR_NARROW = 6
const MENU_WIDTH = 24
const DIALOG_WIDTH = 40
const DIALOG_NARROW = 30
const NARROW_COLUMNS = 60

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
function hpBar(
  value: Hp | null,
  width: number,
  isNarrow: boolean,
): { full: string; empty: string; color: string; label: string } {
  if (value === null || value.window <= 0) {
    return { full: '▰'.repeat(width), empty: '', color: HP_GREEN, label: '--/--' }
  }
  const left = Math.max(0, value.window - value.tokens)
  const ratio = left / value.window
  const filled = Math.min(width, Math.max(left > 0 ? 1 : 0, Math.round(ratio * width)))
  const color = ratio > 0.5 ? HP_GREEN : ratio > 0.2 ? HP_YELLOW : HP_RED

  return {
    full: '▰'.repeat(filled),
    empty: '▱'.repeat(width - filled),
    color,
    label: isNarrow
      ? `${Math.round(ratio * 100)}%`
      : `${Math.round(ratio * 100)}% ${formatTokens(left)}/${formatTokens(value.window)}`,
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

/** A PowerShell script as `-EncodedCommand` takes it: UTF-16LE, base64. */
function encodePowerShell(script: string): string {
  let binary = ''
  for (let i = 0; i < script.length; i++) {
    const code = script.charCodeAt(i)
    binary += String.fromCharCode(code & 0xff, code >> 8)
  }

  return btoa(binary)
}

/**
 * Plays the report-saved jingle. `$.audio.play` sounds only on macOS, so a
 * Windows host plays the file through PowerShell's SoundPlayer instead.
 */
async function playReport($: EngineInterface): Promise<void> {
  const root = $.plugin.root
  if (!/^[A-Za-z]:[\\/]/.test(root)) {
    await $.audio.play({ asset: REPORT_SOUND })
    return
  }
  const file = `${root}\\${REPORT_SOUND.replace('/', '\\')}`.replace(/'/g, "''")
  const script = `(New-Object System.Media.SoundPlayer '${file}').PlaySync()`
  await $.process.run(
    ['powershell.exe', '-NoProfile', '-NonInteractive', '-EncodedCommand', encodePowerShell(script)],
    { timeoutMs: 10_000 },
  )
}

export const register: Register = on => {
  let isIntroTimed = false

  on('session.start', async ($, e, next) => {
    const savedOn = await $.store.get('isOn')
    if (typeof savedOn === 'boolean') await update($, isOn, () => savedOn)
    const savedSound = await $.store.get('isSoundOn')
    if (typeof savedSound === 'boolean') await update($, isSoundOn, () => savedSound)
    await $.command.register({
      name: 'pokemon',
      description: '포켓몬 배틀 화면을 켜고 끕니다 (sound: 효과음 켜고 끄기)',
      argumentHint: '[sound]',
    })
    if (e.isInteractive && (await read($, isOn))) {
      await update($, isIntro, () => true)
    }

    return next(e)
  })

  on('command.run', { command: 'pokemon' }, async ($, e) => {
    if (e.args.trim() === 'sound') {
      const sound = !(await read($, isSoundOn))
      await update($, isSoundOn, () => sound)
      await $.store.set('isSoundOn', sound)

      return { text: sound ? '리포트 저장 효과음 ON!' : '리포트 저장 효과음 OFF.' }
    }
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

  on('prompt.submit', async ($, e, next) => {
    await update($, isIntro, () => false)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      await update($, move, () => null)
      if (e.reason === 'answer' && (await read($, isOn)) && (await read($, isSoundOn))) {
        $.clock.after(0, () => void playReport($).catch(() => undefined))
      }
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !(await read($, isOn))) return next(e)
    if (e.surface !== 'terminal' && e.surface !== 'desktop') return next(e)

    const columns = e.props.bodyColumns
    const rows = e.props.maxRows
    const isWorking = e.props.isWorking
    const { Box, Text } = $.ui.resolve(e)
    const draw = (art: typeof PIKACHU, key: string, alt: string, px: number) => {
      if (e.surface === 'terminal') {
        const { Raster } = $.ui.resolve(e)
        return <Raster key={key} columns={art.columns} rows={art.rows} cells={art.cells} />
      }
      const { Svg } = $.ui.resolve(e)
      return <Svg source={art.svg} alt={alt} width={px} height={Math.round((px * art.rows * 2) / art.columns)} />
    }

    if (await read($, isIntro)) {
      const logo = LOGOS.find(one => rows >= one.rows && columns >= one.columns)
      if (logo) {
        // The clock starts at the first draw: the session starts well before
        // the screen is up, and a timer begun then can run out unseen.
        if (!isIntroTimed) {
          isIntroTimed = true
          $.clock.after(INTRO_MS, () => void update($, isIntro, () => false))
        }

        return (
          <Box flexDirection="column" alignItems="center">
            {draw(logo, 'logo', '포켓몬 로고', 320)}
          </Box>
        )
      }
    }

    const current = await read($, move)
    const isNarrow = columns < NARROW_COLUMNS
    const bar = hpBar(await read($, hp), isNarrow ? HP_BAR_NARROW : HP_BAR_WIDTH, isNarrow)

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

    if (rows < 6 || columns < 40) {
      return (
        <Box>
          <Text color={RED}>◓ </Text>
          {message}
          <Text>{'  '}</Text>
          {status}
        </Box>
      )
    }

    // Zooming in leaves fewer cells. The menu goes first, then the dialogue
    // box narrows; Pikachu stays while even a narrow box fits beside it.
    const dialog = isNarrow ? DIALOG_NARROW : DIALOG_WIDTH
    const hasPikachu = rows >= PIKACHU.rows + 1 && columns >= PIKACHU.columns + 1 + PIKACHU_BESIDE_MIN
    const hasMenu = columns >= (hasPikachu ? PIKACHU.columns + 1 : 0) + dialog + 1 + MENU_WIDTH

    return (
      <Box flexDirection="row" gap={1}>
        {hasPikachu && draw(PIKACHU, 'pikachu', '피카츄', 64)}
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
        {hasMenu && (
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
