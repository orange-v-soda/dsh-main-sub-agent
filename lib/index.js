/**
 * dsh-main-sub-agent — AGENTS.md 风格的规则注入插件，主/子 agent 分别取不同文件。
 *
 * 为每个 agent 在每一步请求前，读取两处规则文件并拼成一条 user 消息插进
 * 本轮请求的消息列表（位于最后一条已认领消息之后、所有工具结果之前）：
 *
 *   全局   ~/.dsh/agent-rules/{main,sub}.md
 *   工作区 <cwd>/.dsh/agent-rules/{main,sub}.md
 *
 * 主 agent 读 main，子 agent（session.header.origin === 'subagent'）读 sub。
 * 文件从宽泛到具体拼接；不存在就跳过；两个都没有则不注入。
 *
 * 与 AGENTS.md 插件的差别：这里不把消息写进会话日志，只做每步的请求注入。
 * 因此压缩改写 surface 之后，下一步自然会再补一份，无需做压缩补偿；代价是
 * 导出会话记录时看不到这段规则。
 */

import { readFile, stat } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { join } from 'node:path'

const SOURCE_KIND = 'agent-rules'

/** 文件读取缓存：path -> { stamp, text } */
const cache = new Map()

function dshHome() {
  return process.env.DSH_HOME?.trim() || join(homedir(), '.dsh')
}

function ruleFiles(agent) {
  const sub = agent.session?.header?.origin === 'subagent'
  const name = sub ? 'sub.md' : 'main.md'
  const cwd = agent.session?.header?.cwd
  const paths = [join(dshHome(), 'agent-rules', name)]
  if (typeof cwd === 'string' && cwd.length > 0) paths.push(join(cwd, '.dsh', 'agent-rules', name))
  return { sub, paths }
}

/** 读取一个规则文件；不存在返回 undefined，读失败记日志后跳过。 */
async function readRule(ctx, path) {
  try {
    const info = await stat(path)
    if (!info.isFile() || info.size === 0) return undefined
    const stamp = `${info.mtimeMs}:${info.size}`
    const hit = cache.get(path)
    if (hit !== undefined && hit.stamp === stamp) return hit.text
    const text = (await readFile(path, 'utf8')).trim()
    if (text.length === 0) return undefined
    cache.set(path, { stamp, text })
    return text
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined
    ctx.logger?.warn?.(`agent-rules: cannot read ${path}: ${error?.message ?? error}`)
    return undefined
  }
}

/** 按 AGENTS.md 的样式把多份文件拼成一段文本。 */
async function composeRules(ctx, agent) {
  const { paths } = ruleFiles(agent)
  const sections = []
  for (const path of paths) {
    const text = await readRule(ctx, path)
    if (text !== undefined) sections.push(`Instructions from: ${path}\n\n${text}`)
  }
  return sections.length === 0 ? undefined : sections.join('\n\n')
}

function sameRules(message, text) {
  if (message?.source?.kind !== SOURCE_KIND || !Array.isArray(message.content)) return false
  return message.content.some((block) => block?.type === 'text' && block.text === text)
}

export function apply(ctx) {
  ctx.on('agent/pre-step', async ({ agent, messages, signal }, next) => {
    const decision = await next()
    if (decision.kind === 'reject') return decision

    // 注入是锦上添花：这里任何失败都只记录、不改动决策，保证插件出错不会
    // 让 agent 卡死或拒绝执行。
    try {
      const text = await composeRules(ctx, agent)
      signal?.throwIfAborted?.()
      if (text === undefined) return decision

      // 本轮已经有了（例如上一步插入后仍在本轮消息里）就不重复插入。
      if (decision.messages.some((message) => sameRules(message, text))) return decision

      const message = {
        id: randomUUID(),
        role: 'user',
        content: [{ type: 'text', text }],
        source: { kind: SOURCE_KIND, scope: agent.session?.header?.origin === 'subagent' ? 'sub' : 'main' },
      }

      // 插到消息列表最前面：让规则先于任何用户消息和工具结果出现。
      return {
        ...decision,
        messages: [message, ...decision.messages],
      }
    } catch (error) {
      ctx.logger?.warn?.(`agent-rules: injection skipped: ${error?.message ?? error}`)
      return decision
    }
  })
}
