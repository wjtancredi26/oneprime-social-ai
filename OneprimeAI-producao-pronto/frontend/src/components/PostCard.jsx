import { useState } from "react";
import formatDate from "../utils/formatDate";
import { publishFacebookPost } from "../services/publishService";
import { retryPost } from "../services/postsService";

function getStatusLabel(status) {
  const labels = {
    AGENDADO: "Agendado",
    PUBLICANDO: "Publicando",
    PUBLICADO: "Publicado",
    ERRO: "Erro",
  };

  return labels[status] || status;
}

function getStatusClass(status) {
  return String(status || "").toLowerCase();
}

export default function PostCard({
  post,
  onDelete,
  onRefresh,
}) {
  const [publishing, setPublishing] = useState(false);
  const [retrying, setRetrying] = useState(false);

  async function handlePublish() {
    const selectedNetwork =
      post.network || "Facebook e Instagram";

    const confirmPublish = window.confirm(
      `Deseja publicar esta postagem agora em: ${selectedNetwork}?`
    );

    if (!confirmPublish) {
      return;
    }

    setPublishing(true);

    try {
      const data = await publishFacebookPost(post.id);

      if (!data.success) {
        throw new Error(
          data.error || "Erro ao publicar a postagem."
        );
      }

      alert("Postagem publicada com sucesso!");

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      alert(`Erro ao publicar: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  }

  async function handleRetry() {
    const confirmRetry = window.confirm(
      "Deseja programar uma nova tentativa de publicação?"
    );

    if (!confirmRetry) {
      return;
    }

    setRetrying(true);

    try {
      const data = await retryPost(post.id);

      if (!data.success) {
        throw new Error(
          data.error ||
            "Não foi possível programar a nova tentativa."
        );
      }

      alert(
        data.message ||
          "Nova tentativa de publicação programada."
      );

      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      alert(`Erro ao tentar novamente: ${error.message}`);
    } finally {
      setRetrying(false);
    }
  }

  const facebookPublished = Boolean(
    post.facebookPostId
  );

  const instagramPublished = Boolean(
    post.instagramPostId
  );

  return (
    <div className="agenda-card">
      <div className="post-card-header">
        <div>
          <strong>
            {formatDate(post.scheduledAt)}
          </strong>

          <span>{post.network}</span>
        </div>

        <span
          className={`status-badge ${getStatusClass(
            post.status
          )}`}
        >
          {getStatusLabel(post.status)}
        </span>
      </div>

      <p>{post.caption}</p>

      {post.hashtags && (
        <p className="post-hashtags">
          {post.hashtags}
        </p>
      )}

      {post.imageUrl && (
        <div className="image-preview">
          <img
            src={post.imageUrl}
            alt="Imagem da postagem"
          />
        </div>
      )}

      <div className="post-details">
        <small>
          Tentativas: {post.attempts || 0}
        </small>

        {post.publishedAt && (
          <small>
            Publicado em:{" "}
            {formatDate(post.publishedAt)}
          </small>
        )}
      </div>

      {(facebookPublished ||
        instagramPublished) && (
        <div className="network-results">
          <strong>
            Resultado por rede
          </strong>

          <div>
            <span>
              Facebook:{" "}
              {facebookPublished
                ? "✅ Publicado"
                : "⏳ Pendente"}
            </span>

            <span>
              Instagram:{" "}
              {instagramPublished
                ? "✅ Publicado"
                : "⏳ Pendente"}
            </span>
          </div>
        </div>
      )}

      {post.status === "ERRO" &&
        post.lastError && (
          <div className="post-error">
            <strong>
              Não foi possível publicar
            </strong>

            <p>{post.lastError}</p>
          </div>
        )}

      <div className="actions">
        {post.status !== "PUBLICADO" &&
          post.status !== "PUBLICANDO" && (
            <button
              className="primary"
              onClick={handlePublish}
              disabled={
                publishing || retrying
              }
            >
              {publishing
                ? "Publicando..."
                : "🚀 Publicar agora"}
            </button>
          )}

        {post.status === "ERRO" && (
          <button
            className="secondary"
            onClick={handleRetry}
            disabled={
              retrying || publishing
            }
          >
            {retrying
              ? "Programando..."
              : "🔄 Tentar novamente"}
          </button>
        )}

        <button
          className="secondary"
          onClick={() =>
            onDelete(post.id)
          }
          disabled={
            publishing ||
            retrying ||
            post.status === "PUBLICANDO"
          }
        >
          🗑️ Excluir
        </button>
      </div>
    </div>
  );
}