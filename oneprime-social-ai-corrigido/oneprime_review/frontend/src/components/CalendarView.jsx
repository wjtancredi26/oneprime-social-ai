import formatDate from "../utils/formatDate";

export default function CalendarView({ posts }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();

  const days = Array.from({ length: totalDays }, (_, index) => index + 1);

  function postsByDay(day) {
    return posts.filter((post) => {
      const postDate = new Date(post.scheduledAt);
      return (
        postDate.getDate() === day &&
        postDate.getMonth() === month &&
        postDate.getFullYear() === year
      );
    });
  }

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <h2>
          📅 {today.toLocaleString("pt-BR", { month: "long" })} de {year}
        </h2>
      </div>

      <div className="calendar-weekdays">
        <strong>Dom</strong>
        <strong>Seg</strong>
        <strong>Ter</strong>
        <strong>Qua</strong>
        <strong>Qui</strong>
        <strong>Sex</strong>
        <strong>Sáb</strong>
      </div>

      <div className="calendar-grid">
        {Array.from({ length: firstDay.getDay() }).map((_, index) => (
          <div className="calendar-day empty" key={`empty-${index}`} />
        ))}

        {days.map((day) => {
          const dayPosts = postsByDay(day);

          return (
            <div className="calendar-day" key={day}>
              <div className="day-number">{day}</div>

              {dayPosts.slice(0, 3).map((post) => (
                <div className="calendar-post" key={post.id}>
                  <span>{post.network}</span>
                  <p>{formatDate(post.scheduledAt).slice(11)}</p>
                </div>
              ))}

              {dayPosts.length > 3 && (
                <small>+{dayPosts.length - 3} posts</small>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}