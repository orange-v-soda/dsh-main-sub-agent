# dsh-main-sub-agent

按 agent 角色分别注入规则文件：主 agent 读 `main.md`，子 agent 读 `sub.md`，每一步请求前重新读取并插到消息列表最前面。

规则随每一步重算，所以上下文被压缩之后会自动补回，效果上等于常驻。

## 安装

在插件管理器的目标里填：

```
github:orange-v-soda/dsh-main-sub-agent
```

## 适用场景

- 项目里已经在用 AGENTS.md，但希望主 agent 和子 agent 遵守不同的规则。
- 规则写得比较长，不希望它进会话日志、也不希望被上下文压缩吃掉。

## 规则文件

| agent | 全局 | 工作区 |
| --- | --- | --- |
| 主 agent | `~/.dsh/agent-rules/main.md` | `<cwd>/.dsh/agent-rules/main.md` |
| 子 agent | `~/.dsh/agent-rules/sub.md` | `<cwd>/.dsh/agent-rules/sub.md` |

- 从宽泛到具体拼接：全局在前，工作区在后。
- 每个文件渲染成 `Instructions from: <路径>` 加正文。
- 文件不存在就跳过，两个都不存在则不注入。
- `DSH_HOME` 可以覆盖全局根目录。

## 行为

挂在 `agent/pre-step` 瀑布上，每步执行一次。读取按 mtime + size 缓存，文件没变就不重复读盘；同一份文本在本轮消息里已存在时不重复插入。

不写入会话日志——导出会话记录时看不到这段规则。这是与 AGENTS.md 有意为之的差别，换来的是它不参与压缩、也不需要做基线对账。

## 技术说明

[docs/technical.md](docs/technical.md) —— 挂载点、注入位置、缓存与去重逻辑。建议交给 agent 阅读。

## 声明

- **适配版本**：DSH `>= 0.2.1-rc.2`
- **开源协议**：MIT
- **纯本地**：只读本地规则文件，不联网、不上传、不写会话数据
