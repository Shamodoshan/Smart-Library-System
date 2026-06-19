import React from 'react';

const seatPositions = {
  seat_1: { top: '30%', left: '20%' },
  seat_2: { top: '30%', left: '40%' },
  seat_3: { top: '30%', left: '60%' },
  seat_4: { top: '30%', left: '80%' },
  seat_5: { top: '70%', left: '20%' },
  seat_6: { top: '70%', left: '40%' },
  seat_7: { top: '70%', left: '60%' },
  seat_8: { top: '70%', left: '80%' },
};

const getSeatPosition = (seatId, index) => {
  if (seatPositions[seatId]) return seatPositions[seatId];
  const columns = 4;
  const row = Math.floor(index / columns);
  const col = index % columns;
  return {
    top: `${30 + row * 40}%`,
    left: `${20 + col * 20}%`,
  };
};

const formatSeatLabel = (seatId) => seatId.replace('_', ' ').toUpperCase();

const SeatMap = ({ seats, selectedSeat, onSeatSelect }) => (
  <section className="student-panel seat-map-panel" aria-label="Library seat map">
    <div className="student-panel-header">
      <div>
        <h2 className="student-panel-title">Library Seat Map</h2>
        <p className="student-panel-subtitle">Live layout — tap a seat to view status</p>
      </div>
      <div className="map-legend">
        <span className="map-legend-item">
          <span className="status-dot available" /> Available
        </span>
        <span className="map-legend-item">
          <span className="status-dot occupied" /> Occupied
        </span>
        <span className="map-legend-item">
          <span className="status-dot reserved" /> Reserved
        </span>
      </div>
    </div>

    <div className="library-map-scroll">
      <div className="library-map">
        <div className="entrance-gate" />

        {seats.length === 0 ? (
          <div className="library-map-empty">Syncing seat data…</div>
        ) : (
          seats.map((seat, index) => {
            const position = getSeatPosition(seat.id, index);
            const isSelected = selectedSeat?.id === seat.id;
            const seatNum = parseInt(seat.id.replace(/[^\d]/g, ''), 10) || index + 1;
            const seatType = seatNum % 2 === 0 ? 'Focus' : 'Regular';

            return (
              <button
                key={seat.id}
                type="button"
                className={`seat-node ${seat.status}${isSelected ? ' warning' : ''}`}
                style={{
                  top: position.top,
                  left: position.left,
                }}
                onClick={() => onSeatSelect(seat)}
                aria-label={`${formatSeatLabel(seat.id)}, ${seat.status}`}
                aria-pressed={isSelected}
              >
                <span className="seat-node-name">{formatSeatLabel(seat.id)}</span>
                <span className="seat-node-occupant">
                  {seat.status === 'available' ? 'Open' : seat.status}
                </span>
                <span className={`seat-node-fsr seat-node-fsr--${seatType.toLowerCase()}`}>
                  {seatType}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  </section>
);

export default SeatMap;
