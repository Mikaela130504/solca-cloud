import Card from "../common/Card.jsx";

export default function ClinicalTimeline({ events }) {
  return (
    <Card title="Timeline clinico" subtitle="Eventos ordenados por fecha">
      <div className="timeline">
        {events.map((event) => (
          <article key={`${event.fecha}-${event.title}`}>
            <time>{event.fecha}</time>
            <div>
              <strong>{event.title}</strong>
              <p>{event.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
