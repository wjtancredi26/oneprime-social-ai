import Card from "./ui/Card";

export default function StatCard({ icon, title, value, subtitle }) {
  return (
    <Card className="stat-card">
      <div className="stat-card-icon">{icon}</div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{subtitle}</small>
      </div>
    </Card>
  );
}