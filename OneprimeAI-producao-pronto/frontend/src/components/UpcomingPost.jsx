import { useState } from "react";
import formatDate from "../utils/formatDate";
import PostPreviewModal from "./PostPreviewModal";

import Button from "./ui/Button";
import Card from "./ui/Card";
import Badge from "./ui/Badge";

export default function UpcomingPost({ post }) {
  const [selectedPost, setSelectedPost] = useState(null);

  if (!post) {
    return (
      <Card className="upcoming-post">
        <h2>📌 Próxima postagem</h2>
        <p>Nenhuma postagem futura encontrada.</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="upcoming-post">
        <div className="upcoming-header">
          <div>
            <h2>📌 Próxima postagem</h2>
            <Badge>{post.network}</Badge>
          </div>

          <small>{post.status}</small>
        </div>

        <div className="upcoming-date">{formatDate(post.scheduledAt)}</div>

        <p className="upcoming-caption">
          {post.caption?.length > 220
            ? post.caption.substring(0, 220) + "..."
            : post.caption}
        </p>

        <div className="actions">
          <Button variant="secondary" onClick={() => setSelectedPost(post)}>
            👁️ Visualizar
          </Button>

          <Button variant="secondary">✏️ Editar</Button>

          <Button variant="secondary">📄 Duplicar</Button>
        </div>
      </Card>

      <PostPreviewModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </>
  );
}