import { useEffect, useState } from "react";
import { getPosts } from "../services/postsService";

import StatCard from "../components/StatCard";
import UpcomingPost from "../components/UpcomingPost";
import QuickActions from "../components/QuickActions";

export default function Dashboard({ setView }) {
  const [posts, setPosts] = useState([]);
  const [nextPost, setNextPost] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadDashboard() {
    setLoading(true);

    try {
      const data = await getPosts();
      const postsList = data || [];

      setPosts(postsList);

      const futurePosts = postsList
        .filter((post) => new Date(post.scheduledAt) >= new Date())
        .sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime()
        );

      setNextPost(futurePosts[0] || null);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const postsWithImage = posts.filter((post) => post.imageUrl).length;

  const networksUsed = [
    ...new Set(posts.map((post) => post.network)),
  ].filter(Boolean).length;

  return (
    <>
      <section className="hero-panel">
        <div>
          <span className="badge">OnePrime Social AI</span>

          <h2>Bom dia, Wilian 👋</h2>

          <p>
            Seu painel inteligente de marketing está pronto para trabalhar por
            você.
          </p>
        </div>

        <button className="primary" onClick={loadDashboard}>
          {loading ? "Atualizando..." : "Atualizar painel"}
        </button>
      </section>

      <section className="stats-grid">
        <StatCard
          icon="📅"
          title="Posts agendados"
          value={posts.length}
          subtitle="Total no banco"
        />

        <StatCard
          icon="🤖"
          title="Conteúdos IA"
          value={posts.length}
          subtitle="Criados pela IA"
        />

        <StatCard
          icon="🎨"
          title="Imagens"
          value={postsWithImage}
          subtitle="Com imagem gerada"
        />

        <StatCard
          icon="📱"
          title="Redes usadas"
          value={networksUsed}
          subtitle="Canais ativos"
        />
      </section>

      <section className="dashboard-grid">
        <UpcomingPost post={nextPost} />
        <QuickActions setView={setView} />
      </section>

      <section className="panel premium-panel">
        <h2>📝 Últimas atividades</h2>

        {posts.length === 0 ? (
          <p>Ainda não há atividades registradas.</p>
        ) : (
          posts.slice(0, 5).map((post) => (
            <div className="activity-item" key={post.id}>
              <strong>{post.network}</strong>

              <p>
                Nova postagem agendada para{" "}
                {new Date(post.scheduledAt).toLocaleString("pt-BR")}
              </p>
            </div>
          ))
        )}
      </section>
    </>
  );
}