import { useState } from "react";
import { askOnePrimeAI } from "../ai/assistant";

import ChatHeader from "./ai/ChatHeader";
import ChatMessage from "./ai/ChatMessage";
import TypingIndicator from "./ai/TypingIndicator";
import ScheduleCard from "./ai/renderers/ScheduleCard";

export default function OnePrimeAI() {
  const [message, setMessage] = useState("");
  const [lastMarketingPayload, setLastMarketingPayload] = useState(null);
  const [lastImageUrl, setLastImageUrl] = useState(null);

  const [chat, setChat] = useState([
    {
      role: "ai",
      text:
        "Olá, Wilian 👋\n\nSou a OnePrime AI. Posso criar campanhas, gerar imagens e agendar tudo por aqui.",
      actions: [],
      image: null,
    },
  ]);

  const [loading, setLoading] = useState(false);

  function buildMessageFromResponse(response) {
    let aiText = "";
    let image = null;

    if (response.type === "marketing") {
      setLastMarketingPayload(response);

      aiText = `Empresa: ${response.company.name}

📝 Legenda:
${response.parsed.legenda}

#️⃣ Hashtags:
${response.parsed.hashtags}

🖼 Ideia de imagem:
${response.parsed.imagem}

⏰ Melhor horário:
${response.parsed.horario}

📲 CTA:
${response.parsed.cta}`;
    }

    if (response.type === "image") {
      aiText = response.image.message || "Imagem gerada com sucesso.";
      image = response.image.imageUrl || null;

      if (image) {
        setLastImageUrl(image);
      }
    }

    if (response.type === "schedule") {
      aiText = `✅ ${response.message}

Postagem salva para:
${new Date(response.post.scheduledAt).toLocaleString("pt-BR")}

Rede:
${response.post.network}`;
    }

    if (response.type === "conversation") {
      aiText = response.parsed.legenda;
    }

    return {
      role: "ai",
      text: aiText,
      actions: response.nextActions || [],
      payload: response,
      image,
    };
  }

  async function handleSend() {
    if (!message.trim() || loading) return;

    const userMessage = message;
    setMessage("");

    setChat((prev) => [
      ...prev,
      { role: "user", text: userMessage, actions: [], image: null },
    ]);

    setLoading(true);

    try {
      const response = await askOnePrimeAI(userMessage);
      const aiMessage = buildMessageFromResponse(response);
      setChat((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      setChat((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Não consegui responder agora. Verifique se o backend está rodando.",
          actions: [],
          image: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSchedule(post) {
    if (loading) return;

    setChat((prev) => [
      ...prev,
      {
        role: "user",
        text: "Salvar este agendamento.",
        actions: [],
        image: null,
      },
    ]);

    setLoading(true);

    try {
      const response = await askOnePrimeAI("", {
        action: "schedule_post",
        post,
      });

      const aiMessage = buildMessageFromResponse(response);
      setChat((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      setChat((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Não consegui salvar o agendamento agora.",
          actions: [],
          image: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action, item) {
    if (loading) return;

    if (action.action === "generate_image") {
      const imagePrompt =
        action.imagePrompt || item.payload?.parsed?.imagem || item.text;

      setChat((prev) => [
        ...prev,
        {
          role: "user",
          text: "Gerar imagem desta campanha.",
          actions: [],
          image: null,
        },
      ]);

      setLoading(true);

      try {
        const response = await askOnePrimeAI("", {
          action: "generate_image",
          imagePrompt,
        });

        const aiMessage = buildMessageFromResponse(response);
        setChat((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error(error);
        setChat((prev) => [
          ...prev,
          {
            role: "ai",
            text: "Não consegui gerar a imagem agora.",
            actions: [],
            image: null,
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    if (action.action === "schedule_post") {
      setChat((prev) => [
        ...prev,
        {
          role: "ai",
          text: "",
          actions: [],
          image: null,
          custom: "schedule",
          payload: lastMarketingPayload || item.payload,
        },
      ]);
    }
  }

  return (
    <aside className="oneprime-ai-panel">
      <ChatHeader />

      <div className="ai-chat">
        {chat.map((item, index) =>
          item.custom === "schedule" ? (
            <ScheduleCard
              key={index}
              payload={item.payload}
              imageUrl={lastImageUrl}
              onSchedule={handleSchedule}
            />
          ) : (
            <ChatMessage
              key={index}
              item={item}
              onAction={(action) => handleAction(action, item)}
            />
          )
        )}

        {loading && <TypingIndicator />}
      </div>

      <div className="ai-input-area">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex: Crie uma campanha para seguro auto..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <button className="primary" onClick={handleSend} disabled={loading}>
          {loading ? "..." : "Enviar"}
        </button>
      </div>
    </aside>
  );
}