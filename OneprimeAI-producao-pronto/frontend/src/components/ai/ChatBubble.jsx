export default function ChatBubble({
  role,
  children
}) {
  return (
    <div
      className={
        role === "user"
          ? "chat-bubble user"
          : "chat-bubble ai"
      }
    >
      {children}
    </div>
  );
}