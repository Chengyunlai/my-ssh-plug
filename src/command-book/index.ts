import { definePlugin } from '../plugin-types'
import CommandBar from './CommandBar'

export default definePlugin({
  id: 'command-book',
  name: '命令手册',
  version: '1.1.0',
  description: '终端底部命令搜索条:100 条常用 Linux 命令,输入关键字实时匹配,点击复制',
  author: 'MySSH',
  builtin: false,
  defaultEnabled: false,
  widget: {
    placement: 'terminal-bottom',
    Component: CommandBar
  }
})
