export const MESSAGE_TTL_MS = 24 * 60 * 60 * 1000

export type ChatMessageDTO = {
  id: string
  content: string
  createdAt: string
  user: { id: string; username: string }
}

export function messageCutoff(now = Date.now()) {
  return new Date(now - MESSAGE_TTL_MS)
}

export function serializeMessage(m: {
  id: string
  content: string
  createdAt: Date
  user: { id: string; username: string }
}): ChatMessageDTO {
  return {
    id: m.id,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    user: { id: m.user.id, username: m.user.username },
  }
}
