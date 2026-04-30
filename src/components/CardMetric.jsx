export default function CardMetric({ title, value, detail, icon: Icon, tone = 'primary' }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-icon" aria-hidden="true">
        {Icon ? <Icon size={20} /> : null}
      </div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}
