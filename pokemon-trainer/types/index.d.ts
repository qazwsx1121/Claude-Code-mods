/**
 * The context window: its size, and the tokens in use once a response has
 * reported them (absent before the session's first answer).
 */
export type Hp = { tokens?: number; window: number }

declare module 'claude-code' {
  interface PluginState {
    'pokemon-trainer': {
      isOn: boolean
      isIntro: boolean
      isSoundOn: boolean
      move: string | null
      hp: Hp | null
    }
  }
}
