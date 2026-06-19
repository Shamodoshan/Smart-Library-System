import React from 'react';

const formatSeatLabel = (seatId) => seatId.replace('_', ' ').toUpperCase();

const getSeatType = (seatId) => {
  const num = parseInt(seatId.replace(/[^\d]/g, ''), 10);
  return num % 2 === 0 ? 'Focus Study Area' : 'Regular Study Area';
};

const statusMessages = {
  available: {
    text: 'This seat is currently open. Visit the library desk and ask an admin to assign it to you.',
    className: 'available',
  },
  occupied: {
    text: 'This seat is in use by another student and cannot be assigned right now.',
    className: 'occupied',
  },
  reserved: {
    text: 'This seat has been reserved by the admin. The assigned student must check in at the library.',
    className: 'reserved',
  },
};

const SeatDetailPanel = ({ seat }) => (
  <section className="student-panel seat-detail-panel">
    <h3 className="student-panel-title" style={{ marginBottom: '1rem' }}>
      Seat Details
    </h3>

    {!seat ? (
      <div className="seat-detail-empty">
        <div className="seat-detail-empty-icon" aria-hidden="true">🪑</div>
        <p style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
          Select a seat on the map to view its current status and study zone type.
        </p>
      </div>
    ) : (
      <>
        <div className="seat-detail-row">
          <span className="seat-detail-label">Seat</span>
          <span className="seat-detail-value">{formatSeatLabel(seat.id)}</span>
        </div>
        <div className="seat-detail-row">
          <span className="seat-detail-label">Status</span>
          <span className={`badge badge-${seat.status}`}>{seat.status}</span>
        </div>
        <div className="seat-detail-row">
          <span className="seat-detail-label">Zone</span>
          <span className="seat-detail-value">{getSeatType(seat.id)}</span>
        </div>

        <div className={`seat-status-message ${statusMessages[seat.status]?.className || ''}`}>
          {statusMessages[seat.status]?.text || 'Status unknown.'}
        </div>
      </>
    )}
  </section>
);

export default SeatDetailPanel;
