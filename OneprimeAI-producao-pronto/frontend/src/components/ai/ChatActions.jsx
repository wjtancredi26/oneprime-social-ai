export default function ChatActions({
  actions = [],
  onAction
}) {
  if (!actions.length) return null;

  return (
    <div className="chat-actions">
      {actions.map((action) => (
        <button
          key={action.action}
          className="secondary"
          onClick={() => onAction(action)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}