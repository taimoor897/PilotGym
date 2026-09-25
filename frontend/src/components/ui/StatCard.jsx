export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  description,
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-icon">
          <Icon size={21} />
        </div>

        {change && (
          <span className="stat-change">
            {change}
          </span>
        )}
      </div>

      <div className="stat-card-value">
        {value}
      </div>

      <div className="stat-card-title">
        {title}
      </div>

      {description && (
        <p>{description}</p>
      )}
    </div>
  );
}