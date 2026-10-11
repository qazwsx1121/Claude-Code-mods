export type Trainer = { level: number; exp: number }

declare module 'claude-code' {
  interface PluginState {
    'pokemon-trainer': {
      isOn: boolean
      move: string | null
      trainer: Trainer
    }
  }
}
