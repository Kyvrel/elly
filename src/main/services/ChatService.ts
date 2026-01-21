export class ChatService {
  sendMessage(threadId: string, message: string, model: string) {
    console.warn(
      `ChatService.sendMessage called for threadId: ${threadId}, message: "${message}", model: "${model}" but is not yet implemented.`
    )
  }
}

export const chatService = new ChatService()
