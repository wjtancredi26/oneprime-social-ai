import formatDate from "../utils/formatDate";

export default function PostPreviewModal({ post, onClose }) {
  if (!post) return null;

  return (
    <div className="modal-overlay">
      <div className="post-modal">
        <div className="modal-header">
          <div>
            <span className="badge">{post.network}</span>
            <h2>Visualizar postagem</h2>
          </div>

          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {post.imageUrl && (
          <div className="modal-image">
            <img src={post.imageUrl} alt="Imagem da postagem" />
          </div>
        )}

        <div className="modal-info">
          <strong>Data e horário</strong>
          <p>{formatDate(post.scheduledAt)}</p>

          <strong>Status</strong>
          <p>{post.status}</p>

          <strong>Legenda</strong>
          <p>{post.caption}</p>

          {post.hashtags && (
            <>
              <strong>Hashtags</strong>
              <p>{post.hashtags}</p>
            </>
          )}

          {post.cta && (
            <>
              <strong>CTA</strong>
              <p>{post.cta}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}