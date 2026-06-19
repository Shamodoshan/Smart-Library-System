import React from 'react';

const ReadOnlyBanner = () => (
  <div className="readonly-banner" role="status">
    <div className="readonly-banner-icon" aria-hidden="true">👁</div>
    <div>
      <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.15rem' }}>
        View-only access
      </strong>
      You can monitor live seat availability here. Seat reservations are assigned by the library admin
      at the desk — online booking is not available for students.
    </div>
  </div>
);

export default ReadOnlyBanner;
