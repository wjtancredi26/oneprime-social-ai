import { useState } from "react";
import formatDate from "../utils/formatDate";
import { publishFacebookPost } from "../services/publishService";

export default function PostCard({ post, onDelete, onRefresh }) {
  const [publishing, setPublishing] = useState(false);

  async function handlePublish() {
    const confirmPublish = window.confirm(
      "Deseja publicar esta postagem agora no Facebook?"
    );

    if (!confirmPublish) return;

    setPublishing(true);

    try {
      const data = await publishFacebookPost(post.id);

      if (!data.success) {
        throw new Error(data.error || "Erro ao publicar.");
      }

      alert("Postagem publicada com sucesso no Facebook!");

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      alert("Erro ao publicar: " + error.message);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="agenda-card">
      <div>
        <strong>{formatDate(post.scheduledAt)}</strong>
        <span>{post.network}</span>
      </div>

      <p>{post.caption}</p>

      {post.imageUrl && (
        <div className="image-preview">
          <img src={post.imageUrl} alt="Imagem do post" />
        </div>
      )}

      <small>Status: {post.status}</small>

      <div className="actions">
        {post.status !== "PUBLICADO" && (
          <button
            className="primary"
            onClick={handlePublish}
            disabled={publishing}
          >
            {publishing ? "Publicando..." : "🚀 Publicar Agora"}
          </button>
        )}

        <button className="secondary" onClick={() => onDelete(post.id)}>
          🗑️ Excluir
        </button>
      </div>
    </div>
  );
}