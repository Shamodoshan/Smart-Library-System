import React from 'react';

const formatSeatLabel = (seatId) => seatId.replace('_', ' ').toUpperCase();

const getSeatType = (seatId, index) => {
  const num = parseInt(seatId.replace(/[^\d]/g, ''), 10) || index + 1;
  return num % 2 === 0 ? 'Focus' : 'Regular';
};

const SeatGrid = ({ seats, selectedSeat, onSeatSelect }) => (
  <section className="student-panel seat-grid-panel" aria-label="Seat list">
    <div className="student-panel-header">
      <div>
        <h2 className="student-panel-title">Browse Seats</h2>
        <p className="student-panel-subtitle">Tap a seat to view its status</p>
      </div>
    </div>

    {seats.length === 0 ? (
      <p className="seat-grid-empty">Syncing seat data…</p>
    ) : (
      <div className="seat-grid">
        {seats.map((seat, index) => {
          const isSelected = selectedSeat?.id === seat.id;
          const seatType = getSeatType(seat.id, index);

          return (
            <button
              key={seat.id}
              type="button"
              className={`seat-grid-item ${seat.status}${isSelected ? ' selected' : ''}`}
              onClick={() => onSeatSelect(seat)}
              aria-label={`${formatSeatLabel(seat.id)}, ${seat.status}`}
              aria-pressed={isSelected}
            >
              <span className="seat-grid-item-name">{formatSeatLabel(seat.id)}</span>
              <span className={`badge badge-${seat.status} seat-grid-item-badge`}>
                {seat.status === 'available' ? 'Open' : seat.status}
              </span>
              <span className="seat-grid-item-type">{seatType}</span>
            </button>
          );
        })}
      </div>
    )}
  </section>
);

export default SeatGrid;
