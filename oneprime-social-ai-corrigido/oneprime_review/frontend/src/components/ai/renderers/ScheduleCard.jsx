import { useState } from "react";
import Button from "../../ui/Button";
import Card from "../../ui/Card";

export default function ScheduleCard({ payload, imageUrl, onSchedule }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [network, setNetwork] = useState("Instagram e Facebook");

  function handleSubmit() {
    if (!date || !time) {
      alert("Escolha a data e o horário.");
      return;
    }

    const scheduledAt = `${date}T${time}:00`;

    onSchedule({
      prompt: payload?.parsed?.legenda || "",
      caption: payload?.parsed?.legenda || "",
      hashtags: payload?.parsed?.hashtags || "",
      imageIdea: payload?.parsed?.imagem || "",
      cta: payload?.parsed?.cta || "",
      imageUrl: imageUrl || null,
      network,
      scheduledAt,
    });
  }

  return (
    <Card className="schedule-card">
      <h3>📅 Agendar postagem</h3>

      <label>Data</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <label>Horário</label>
      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />

      <label>Rede social</label>
      <select value={network} onChange={(e) => setNetwork(e.target.value)}>
        <option>Instagram</option>
        <option>Facebook</option>
        <option>Instagram e Facebook</option>
        <option>WhatsApp Status</option>
      </select>

      <Button variant="primary" onClick={handleSubmit}>
        Salvar agendamento
      </Button>
    </Card>
  );
}