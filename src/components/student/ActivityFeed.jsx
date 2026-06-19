import React from 'react';

const ActivityFeed = ({ logs }) => (
  <section className="student-panel activity-feed-panel" style={{ display: 'flex', flexDirection: 'column' }}>
    <div className="activity-feed-header">
      <h3 className="student-panel-title">Live Activity</h3>
      <span className="live-indicator">Live</span>
    </div>

    <div className="activity-feed">
      {logs.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', padding: '0.5rem' }}>Waiting for updates…</p>
      ) : (
        logs.map((log, index) => (
          <div key={`${log.time}-${index}`} className="log-line">
            <span className="log-time">{log.time}</span>
            <span className={`log-tag ${log.type}`}>{log.tag}</span>
            <span className="log-message">
              {log.msg}
              {log.details && <span className="log-details"> ({log.details})</span>}
            </span>
          </div>
        ))
      )}
    </div>
  </section>
);

export default ActivityFeed;
