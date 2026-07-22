export default function ChatImage({ image }) {
  if (!image) return null;

  return (
    <div className="chat-image">
      <img
        src={image}
        alt="Imagem criada pela IA"
      />
    </div>
  );
}