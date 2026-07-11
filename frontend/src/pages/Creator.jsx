import { useState } from "react";
import { generateContent, generateImage } from "../services/aiService";
import { createPost } from "../services/postsService";
import { publishPostNow } from "../services/publishService";
import parseAIResponse from "../utils/parseAIResponse";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function Creator() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [imageFormat, setImageFormat] = useState("1024x1024");
  const [imageStyle, setImageStyle] = useState("Publicidade premium");
  const [imageResult, setImageResult] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleNetwork, setScheduleNetwork] = useState("Instagram e Facebook");
  const [scheduleMessage, setScheduleMessage] = useState("");

  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");

  async function uploadGeneratedImageIfNeeded(currentImage) {
    if (!currentImage) return null;

    if (currentImage.startsWith("http")) {
      return currentImage;
    }

    if (!currentImage.startsWith("data:image")) {
      return null;
    }

    const response = await fetch(currentImage);
    const blob = await response.blob();

    const file = new File([blob], "oneprime-post.png", {
      type: blob.type || "image/png",
    });

    const formData = new FormData();
    formData.append("image", file);

    const uploadResponse = await fetch(`${API_URL}/media/upload-image`, {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadResponse.json();

    if (!uploadData.success) {
      throw new Error(uploadData.message || "Erro ao enviar imagem.");
    }

    return uploadData.imageUrl;
  }

  function buildMessage() {
    return `${result?.legenda || ""}

${result?.hashtags || ""}

${result?.cta || ""}`.trim();
  }

  async function handleGenerateContent() {
    if (!prompt.trim()) {
      alert("Digite o que deseja criar.");
      return;
    }

    setLoading(true);
    setResult(null);
    setImageResult(null);
    setShowSchedule(false);
    setScheduleMessage("");
    setPublishMessage("");

    try {
      const data = await generateContent(prompt);
      setResult(parseAIResponse(data.content || ""));
    } catch {
      setResult({
        legenda: "Erro ao gerar conteúdo. Verifique se o backend está rodando.",
        hashtags: "",
        imagem: "",
        horario: "",
        cta: "",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateImage() {
    if (!result?.imagem) {
      alert("Gere um conteúdo primeiro.");
      return;
    }

    setImageLoading(true);
    setImageResult("Gerando imagem...");

    try {
      const data = await generateImage(result.imagem, imageFormat, imageStyle);
      setImageResult(data.imageUrl || data.error || "Não foi possível gerar a imagem.");
    } catch {
      setImageResult("Erro ao gerar imagem. Verifique o backend.");
    } finally {
      setImageLoading(false);
    }
  }

  async function handlePublishNow() {
    if (!result?.legenda) {
      alert("Gere o conteúdo primeiro.");
      return;
    }

    setPublishing(true);
    setPublishMessage("");

    try {
      const finalImageUrl = await uploadGeneratedImageIfNeeded(imageResult);
      const message = buildMessage();

      const data = await publishPostNow({
        message,
        imageUrl: finalImageUrl,
        network: scheduleNetwork,
      });

      if (!data.success) {
        throw new Error(data.error || "Erro ao publicar.");
      }

      setPublishMessage(`Publicado com sucesso em: ${scheduleNetwork}!`);
    } catch (error) {
      alert("Erro ao publicar: " + error.message);
    } finally {
      setPublishing(false);
    }
  }

  async function handleSaveSchedule() {
    if (!scheduleDate || !scheduleTime) {
      alert("Escolha a data e o horário.");
      return;
    }

    try {
      const scheduledAt = `${scheduleDate}T${scheduleTime}:00`;
      const finalImageUrl = await uploadGeneratedImageIfNeeded(imageResult);

      const data = await createPost({
        prompt,
        caption: result?.legenda || "",
        hashtags: result?.hashtags || "",
        imageIdea: result?.imagem || "",
        cta: result?.cta || "",
        imageUrl: finalImageUrl,
        network: scheduleNetwork,
        scheduledAt,
      });

      if (!data.success) {
        throw new Error(data.error || "Erro ao salvar agendamento.");
      }

      setScheduleMessage(
        `Postagem salva no banco para ${scheduleDate} às ${scheduleTime} em ${scheduleNetwork}.`
      );
    } catch (error) {
      alert("Erro ao salvar no banco: " + error.message);
    }
  }

  return (
    <section className="panel">
      <h2>🤖 Criador de Conteúdo IA</h2>
      <p>Descreva o que deseja postar hoje.</p>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ex: Crie um post vendendo seguro auto para motorista de aplicativo..."
      />

      <button className="primary" onClick={handleGenerateContent} disabled={loading}>
        {loading ? "Gerando..." : "Gerar Conteúdo"}
      </button>

      {result && (
        <div className="result-box">
          <h2>📝 Legenda</h2>
          <p>{result.legenda}</p>

          <h2>#️⃣ Hashtags</h2>
          <p>{result.hashtags}</p>

          <h2>🖼 Ideia da imagem</h2>
          <p>{result.imagem}</p>

          <h2>⏰ Melhor horário</h2>
          <p>{result.horario}</p>

          <h2>📲 CTA</h2>
          <p>{result.cta}</p>

          <div className="image-options">
            <select value={imageFormat} onChange={(e) => setImageFormat(e.target.value)}>
              <option value="1024x1024">Feed Instagram 1:1</option>
              <option value="1024x1792">Story/Reels 9:16</option>
              <option value="1792x1024">Banner horizontal</option>
            </select>

            <select value={imageStyle} onChange={(e) => setImageStyle(e.target.value)}>
              <option>Publicidade premium</option>
              <option>Ultra realista</option>
              <option>Minimalista</option>
              <option>Luxo</option>
              <option>Cinematográfico</option>
            </select>
          </div>

          <div className="actions">
            <button className="primary" onClick={() => setShowSchedule(true)}>
              📅 Agendar
            </button>

            <button className="secondary" onClick={handlePublishNow} disabled={publishing}>
              {publishing ? "Publicando..." : "🚀 Publicar agora"}
            </button>

            <button
              className="secondary"
              onClick={handleGenerateImage}
              disabled={imageLoading}
            >
              {imageLoading ? "Gerando..." : "🎨 Gerar Imagem"}
            </button>
          </div>

          {publishMessage && <p className="success-message">{publishMessage}</p>}

          {showSchedule && (
            <div className="schedule-box">
              <h2>📅 Agendar Postagem</h2>

              <label>Data</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />

              <label>Horário</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />

              <label>Rede social</label>
              <select
                value={scheduleNetwork}
                onChange={(e) => setScheduleNetwork(e.target.value)}
              >
                <option>Instagram</option>
                <option>Facebook</option>
                <option>Instagram e Facebook</option>
                <option>WhatsApp Status</option>
              </select>

              <button className="primary" onClick={handleSaveSchedule}>
                Salvar Agendamento
              </button>

              {scheduleMessage && <p className="success-message">{scheduleMessage}</p>}
            </div>
          )}

          {imageResult && (
            <div className="image-preview">
              <h2>🎨 Imagem gerada</h2>

              {imageResult.startsWith("http") || imageResult.startsWith("data:image") ? (
                <img src={imageResult} alt="Imagem gerada por IA" />
              ) : (
                <p>{imageResult}</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}