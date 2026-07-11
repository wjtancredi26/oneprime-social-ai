import ChatBubble from "./ChatBubble";
import ChatImage from "./ChatImage";
import ChatActions from "./ChatActions";

export default function ChatMessage({
  item,
  onAction,
}) {
  return (
    <ChatBubble role={item.role}>
      <pre>{item.text}</pre>

      <ChatImage image={item.image} />

      <ChatActions
        actions={item.actions}
        onAction={onAction}
      />
    </ChatBubble>
  );
}