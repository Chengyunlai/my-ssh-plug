import { definePlugin } from '../plugin-types'
import WslPanel from './WslPanel'

export default definePlugin({
  id: 'wsl-terminal',
  name: 'WSL 终端',
  version: '1.0.1',
  description: '在 MySSH 中打开本地 WSL/Ubuntu 终端(仅 Windows)',
  author: 'MySSH',
  category: 'terminal',
  minAppVersion: '0.1.0',
  builtin: false,
  platforms: ['win32'],
  defaultEnabled: false,
  panel: {
    title: 'WSL 终端',
    scope: 'app',
    Component: WslPanel
  }
})