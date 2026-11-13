# <img src="icon.png" width="32" align="middle" alt="" /> dsh-main-sub-agent

一款用于优化子代理体验的dsh插件


## 安装

可通过npm和github两种方式进行安装：

```
@orange-v-soda/dsh-main-sub-agent          # npm
github:orange-v-soda/dsh-main-sub-agent    # GitHub
```

## 什么时候需要？
如果您：
- 不喜欢agent忙于长期任务，而无法反馈进展的体验
- 希望agent能够更智能的调用sub-agent
- 希望独立的对main-agent与sub-agent设定不同的角色
那么本插件或许能有帮助

## 基础构思
- 本插件参考dsh原生功能“AGENTS.md载入”，设计了main.md和sub.md的自动载入
- main.md会自动注入到main-agent（其与用户直接对话）的上下文中
- sub.md会自动注入到sub-agent（被main-agent创建）的上下文中
- 这些内容的地位、注入方式都与AGENTS.md类似，能够长期起到约束效果，但不显示在对话记录中
放置位置示意如下：

| agent | 全局 | 工作区 |
| --- | --- | --- |
| 主 agent | `~/.dsh/agent-rules/main.md` | `<cwd>/.dsh/agent-rules/main.md` |
| 子 agent | `~/.dsh/agent-rules/sub.md` | `<cwd>/.dsh/agent-rules/sub.md` |
- 文件不存在就跳过，都不存在则不注入。

## 文件参考
- main.md和sub.md如同AGENTS.md类似进入上下文，因此纯自然语言表述即可。
- 插件中附带了一份[文件参考样例](docs/agent-rules)
- 安装本插件仅赋予了自动读取这些文件的能力，还需要自行配置规则文件（将其放到合适的位置）

## 技术说明

[docs/technical.md](docs/technical.md) —— 技术文档进一步说明了挂载点、注入位置、缓存与去重逻辑。建议交给 agent 阅读。

## 声明

- **适配版本**：DSH `>= 0.2.1-rc.2`
- **开源协议**：MIT
- **纯本地**：只读本地规则文件，不联网、不上传、不写会话数据
