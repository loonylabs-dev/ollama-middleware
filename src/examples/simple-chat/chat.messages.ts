// src/examples/simple-chat/chat.messages.ts

/**
 * System message for simple chat use case
 */
export const SIMPLE_CHAT_SYSTEM_MESSAGE = `You are a helpful AI assistant. 
Provide clear, concise, and friendly responses to user messages.
Be conversational but informative.`;

/**
 * Template for user messages
 * For simple chat, we typically don't need complex formatting
 */
export const SIMPLE_CHAT_USER_TEMPLATE = (message: string): string => message;
