# AGENTS.md

## 这是什么

DSH 插件，在 `agent/pre-step` 瀑布上给每一步请求注入规则文件。主 agent 读 `main.md`，子 agent 读 `sub.md`。

## 结构

- `lib/index.js` —— 全部逻辑。导出 `apply`。
- `cordis.patch.yml` —— 把自己插进 profile 的 loader 行。
- `package.json` —— `dsh.bundle.patch` 指向上面那个文件，这是被识别为 bundle 的关键。

## 改的时候注意

- 注入必须是「锦上添花」：任何失败都只 `warn`，然后原样返回 `decision`，不能改动决策或抛异常。
- 插入位置是最前面，不要改成追加到末尾。
- 去重靠 `source.kind` 加文本比对，改了 `SOURCE_KIND` 要同步 `sameRules`。
- 规则文件不存在是正常情况，不要当成错误。

## 验证

装进 profile 后新建一个会话，看请求里的第一条 user 消息是不是 `Instructions from: ...`。子 agent 要单独验证一次，它读的是另一个文件。

## 不要做的事

- 不要把规则写进会话日志——这是与 AGENTS.md 插件有意的差别。
- 不要为了「效率」把每步读取改成只读一次，压缩之后要靠每步重算补回来。
