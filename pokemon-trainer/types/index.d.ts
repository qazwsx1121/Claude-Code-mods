/** The context window as the last response left it: tokens in use over the window. */
export type Hp = { tokens: number; window: number }

declare module 'claude-code' {
  interface PluginState {
    'pokemon-trainer': {
      isOn: boolean
      move: string | null
      hp: Hp | null
    }
  }
}
