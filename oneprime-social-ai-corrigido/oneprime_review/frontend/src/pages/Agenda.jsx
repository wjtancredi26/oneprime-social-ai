import { useEffect, useState } from "react";
import api from "../services/api";
import PostCard from "../components/PostCard";

export default function Agenda() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadPosts() {
    try {
      setLoading(true);

      const { data } = await api.get("/posts");

      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar postagens.");
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(id) {
    const confirmDelete = window.confirm(
      "Deseja realmente excluir esta postagem?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/posts/${id}`);

      loadPosts();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir postagem.");
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <section className="panel">
      <div className="agenda-header">
        <div>
          <h2>📅 Agenda de Publicações</h2>
          <p>
            Gerencie todas as campanhas criadas pela OnePrime AI.
          </p>
        </div>

        <button
          className="primary"
          onClick={loadPosts}
        >
          🔄 Atualizar
        </button>
      </div>

      {loading ? (
        <p>Carregando postagens...</p>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <h3>Nenhuma postagem encontrada.</h3>
          <p>
            Crie um conteúdo na aba <strong>Criar Conteúdo</strong>.
          </p>
        </div>
      ) : (
        <div className="agenda-list">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={deletePost}
              onRefresh={loadPosts}
            />
          ))}
        </div>
      )}
    </section>
  );
}