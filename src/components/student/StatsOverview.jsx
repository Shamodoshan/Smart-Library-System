import React from 'react';

const StatsOverview = ({ total, available, occupied, reserved }) => {
  const pct = (count) => (total > 0 ? Math.round((count / total) * 100) : 0);

  const stats = [
    {
      key: 'total',
      icon: '📚',
      value: total,
      label: 'Total Seats',
      sub: 'Library capacity',
    },
    {
      key: 'available',
      icon: '✅',
      value: available,
      label: 'Available',
      sub: `${pct(available)}% of capacity`,
    },
    {
      key: 'occupied',
      icon: '🔵',
      value: occupied,
      label: 'Occupied',
      sub: `${pct(occupied)}% in use now`,
    },
    {
      key: 'reserved',
      icon: '🟡',
      value: reserved,
      label: 'Reserved',
      sub: `${pct(reserved)}% pre-assigned`,
    },
  ];

  return (
    <section aria-label="Seat availability summary">
      <div className="stats-section">
        {stats.map((stat) => (
          <article key={stat.key} className={`stat-card-enhanced ${stat.key}`}>
            <div className="stat-card-header">
              <span className="stat-card-label">{stat.label}</span>
              <span className="stat-card-icon" aria-hidden="true">{stat.icon}</span>
            </div>
            <div className="stat-card-value">{stat.value}</div>
            <div className="stat-card-sub">{stat.sub}</div>
          </article>
        ))}
      </div>

      {total > 0 && (
        <div className="occupancy-bar-wrap" style={{ marginTop: '1rem' }}>
          <div className="occupancy-bar-track" role="img" aria-label="Seat occupancy breakdown">
            <div
              className="occupancy-bar-segment available"
              style={{ width: `${pct(available)}%` }}
              title={`Available: ${available}`}
            />
            <div
              className="occupancy-bar-segment occupied"
              style={{ width: `${pct(occupied)}%` }}
              title={`Occupied: ${occupied}`}
            />
            <div
              className="occupancy-bar-segment reserved"
              style={{ width: `${pct(reserved)}%` }}
              title={`Reserved: ${reserved}`}
            />
          </div>
          <div className="occupancy-legend">
            <span><span className="status-dot available" /> Available {available}</span>
            <span><span className="status-dot occupied" /> Occupied {occupied}</span>
            <span><span className="status-dot reserved" /> Reserved {reserved}</span>
          </div>
        </div>
      )}
    </section>
  );
};

export default StatsOverview;
