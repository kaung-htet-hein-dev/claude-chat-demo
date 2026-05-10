export type MessageRole = "user" | "assistant";

export type Message = {
  id: string;
  chat_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
};

export type Chat = {
  id: string;
  title: string;
  messages?: Message[];
  created_at: string;
};

export type MessageStatus = "sending" | "streaming" | "sent" | "error";

export type UIMessage = Message & {
  status?: MessageStatus;
};
