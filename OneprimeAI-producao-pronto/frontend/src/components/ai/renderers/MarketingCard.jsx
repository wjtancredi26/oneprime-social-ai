import Button from "../../ui/Button";
import Card from "../../ui/Card";

export default function MarketingCard({ data }) {
  if (!data) return null;

  return (
    <Card className="marketing-card">
      <h3>📝 Legenda</h3>

      <div className="marketing-section">
        <p>{data.legenda}</p>

        <Button
          variant="secondary"
          onClick={() =>
            navigator.clipboard.writeText(data.legenda || "")
          }
        >
          📋 Copiar legenda
        </Button>
      </div>

      <hr />

      <h3>🏷 Hashtags</h3>

      <div className="marketing-section">
        <p>{data.hashtags}</p>

        <Button
          variant="secondary"
          onClick={() =>
            navigator.clipboard.writeText(data.hashtags || "")
          }
        >
          📋 Copiar hashtags
        </Button>
      </div>

      <hr />

      <h3>🖼 Ideia da imagem</h3>

      <p>{data.imagem}</p>

      <Button variant="primary">
        🎨 Gerar imagem
      </Button>

      <hr />

      <h3>📅 Melhor horário</h3>

      <p>{data.horario}</p>

      <Button variant="secondary">
        📅 Agendar postagem
      </Button>

      <hr />

      <h3>🚀 CTA</h3>

      <p>{data.cta}</p>
    </Card>
  );
}