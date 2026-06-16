import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// Define seat positions on map (percentage from top/left)
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

const Home = () => {
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [logs, setLogs] = useState([]);
  const prevSeatsRef = useRef([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'seats'), (snapshot) => {
      const fetchedSeats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort seats by ID naturally (seat_1, seat_2, seat_3 etc)
      fetchedSeats.sort((a, b) => {
        return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
      });

      // Compare with previous state to write logs
      const prevSeats = prevSeatsRef.current;
      if (prevSeats.length > 0) {
        fetchedSeats.forEach(seat => {
          const prevSeat = prevSeats.find(s => s.id === seat.id);
          if (prevSeat && prevSeat.status !== seat.status) {
            const timestamp = new Date().toLocaleTimeString();
            let logEvent = null;

            if (seat.status === 'reserved') {
              logEvent = {
                time: timestamp,
                type: 'seat_tap',
                tag: 'seat_tap',
                msg: `Seat ${seat.id.replace('_', ' ').toUpperCase()} reserved`,
                details: 'Slot booked'
              };
            } else if (seat.status === 'occupied') {
              logEvent = {
                time: timestamp,
                type: 'entrance_tap',
                tag: 'entrance_tap',
                msg: `Seat ${seat.id.replace('_', ' ').toUpperCase()} occupied`,
                details: 'Checked in'
              };
            } else if (seat.status === 'available') {
              logEvent = {
                time: timestamp,
                type: 'release',
                tag: 'release',
                msg: `Seat ${seat.id.replace('_', ' ').toUpperCase()} released`,
                details: `previously ${prevSeat.status}`
              };
            }

            if (logEvent) {
              setLogs(prev => [logEvent, ...prev].slice(0, 50));
            }
          }
        });
      } else {
        const timestamp = new Date().toLocaleTimeString();
        setLogs([{
          time: timestamp,
          type: 'system',
          tag: 'system',
          msg: 'Smart Library Monitor Connected',
          details: `${fetchedSeats.length} active seat sensors`
        }]);
      }

      // Sync currently selected seat details if updated externally
      if (selectedSeat) {
        const updatedSelected = fetchedSeats.find(s => s.id === selectedSeat.id);
        if (updatedSelected) {
          setSelectedSeat(updatedSelected);
        }
      }

      prevSeatsRef.current = fetchedSeats;
      setSeats(fetchedSeats);
    }, (error) => {
      console.error("Firestore subscription error:", error);
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [{
        time: timestamp,
        type: 'mismatch',
        tag: 'mismatch',
        msg: 'Connection Offline',
        details: error.message
      }, ...prev]);
    });

    return () => unsubscribe();
  }, [selectedSeat]);

  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
  };

  // Statistics calculations
  const totalSeats = seats.length;
  const availableSeats = seats.filter(s => s.status === 'available').length;
  const occupiedSeats = seats.filter(s => s.status === 'occupied').length;
  const reservedSeats = seats.filter(s => s.status === 'reserved').length;

  // Resolves seat coordinate on floor plan map
  const getSeatPosition = (seatId, index) => {
    if (seatPositions[seatId]) {
      return seatPositions[seatId];
    }
    // Dynamic default grid for layout spacing fallback
    const columns = 4;
    const row = Math.floor(index / columns);
    const col = index % columns;
    return {
      top: `${30 + row * 40}%`,
      left: `${20 + col * 20}%`
    };
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Bar */}
      <header className="glass-panel" style={{
        margin: '1rem 1rem 0 1rem',
        padding: '0.8rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-accent), #4f46e5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
          }}>
            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#fff' }}>L</span>
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #fff, var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SMART LIBRARY MONITOR
            </h1>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.05em' }}>STUDENT READ-ONLY AVAILABILITY PORTAL</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', background: 'rgba(13, 148, 136, 0.1)', padding: '0.35rem 0.7rem', borderRadius: '20px', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
            <span className="status-dot available" style={{ width: '6px', height: '6px' }}></span>
            <span style={{ color: '#2dd4bf', fontWeight: '700', fontSize: '0.7rem' }}>LIVE STATUS REFRESHING</span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="dashboard-grid" style={{ flexGrow: 1 }}>
        
        {/* Left Column: Metrics & Visual Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Stats Cards Grid */}
          <section className="stats-grid">
            <div className="stat-card total">
              <span className="stat-val">{totalSeats}</span>
              <span className="stat-lbl">Library Capacity</span>
            </div>
            <div className="stat-card available">
              <span className="stat-val">{availableSeats}</span>
              <span className="stat-lbl">Seats Available</span>
            </div>
            <div className="stat-card occupied">
              <span className="stat-val">{occupiedSeats}</span>
              <span className="stat-lbl">Seats Occupied</span>
            </div>
            <div className="stat-card reserved">
              <span className="stat-val">{reservedSeats}</span>
              <span className="stat-lbl">Seats Reserved</span>
            </div>
          </section>

          {/* Interactive Library Layout Plan */}
          <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '750', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  Interactive Study Area Seat Map
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Live architectural layout showing seat availability across the hall</p>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: '600' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span className="status-dot available"></span> Available
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span className="status-dot occupied"></span> Occupied
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span className="status-dot reserved"></span> Reserved
                </span>
              </div>
            </div>

            {/* Interactive Seating Layout Canvas */}
            <div className="library-map" style={{ flexGrow: 1, minHeight: '380px' }}>
              <div className="entrance-gate"></div>
              
              {seats.map((seat, index) => {
                const position = getSeatPosition(seat.id, index);
                const isSelected = selectedSeat?.id === seat.id;
                
                // Add Focus/Sensory tags: Even numbers are Focus Study (FOC), Odd numbers are Regular (REG)
                const seatNum = parseInt(seat.id.replace(/[^\d]/g, '')) || index + 1;
                const seatType = seatNum % 2 === 0 ? 'FOC' : 'REG';

                return (
                  <button
                    key={seat.id}
                    className={`seat-node ${seat.status} ${isSelected ? 'warning' : ''}`}
                    style={{
                      top: position.top,
                      left: position.left,
                      border: isSelected ? '3px solid var(--color-warning)' : undefined,
                      boxShadow: isSelected ? '0 0 20px var(--color-warning-glow)' : undefined
                    }}
                    onClick={() => handleSeatClick(seat)}
                  >
                    <span className="seat-node-name">{seat.id.replace('_', ' ').toUpperCase()}</span>
                    <span className="seat-node-occupant">
                      {seat.status === 'available' ? 'Available' : seat.status.toUpperCase()}
                    </span>
                    <span className="seat-node-fsr" style={{
                      color: seatType === 'FOC' ? '#818cf8' : '#9ca3af'
                    }}>
                      {seatType}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

        </div>

        {/* Right Column: Reservation Sidebar & Event Logger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Action Simulation Panel */}
          <section className="glass-panel">
            <h3 style={{
              fontSize: '1.05rem',
              fontWeight: '750',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              Seat Information
            </h3>

            {selectedSeat ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Seat Number</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {selectedSeat.id.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Availability</span>
                  <span className={`badge badge-${selectedSeat.status}`}>{selectedSeat.status}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Study Space Type</span>
                  <span style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    fontWeight: '600'
                  }}>
                    {parseInt(selectedSeat.id.replace(/[^\d]/g, '')) % 2 === 0 ? 'Focus Study Area' : 'Regular Study Area'}
                  </span>
                </div>

                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.4'
                }}>
                  {selectedSeat.status === 'available' ? (
                    <span>🟢 This seat is currently <strong>available</strong>. Please visit the library and scan the table QR code to tap-in and check-in.</span>
                  ) : selectedSeat.status === 'occupied' ? (
                    <span>🔵 This seat is <strong>occupied</strong> by a student. It cannot be used at this time.</span>
                  ) : (
                    <span>🟡 This seat is <strong>reserved</strong>. Pre-booked slots must check-in physically within 15 minutes of reservation start.</span>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🪑</div>
                <p style={{ fontSize: '0.8rem' }}>Select a seat node on the layout map to inspect its real-time availability and specifications.</p>
              </div>
            )}
          </section>

          {/* Real-time live Event Logs Terminal */}
          <section className="glass-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '380px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '750', color: 'var(--text-primary)' }}>
                Library Live Event Feed
              </h3>
              <span className="badge badge-available" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>Feed Active</span>
            </div>
            
            <div className="log-console" style={{ flexGrow: 1 }}>
              {logs.map((log, index) => (
                <div key={index} className="log-line">
                  <span className="log-time">{log.time}</span>
                  <span className={`log-tag ${log.type}`}>{log.tag}</span>
                  <span className="log-message">
                    {log.msg}
                    {log.details && <span className="log-details"> ({log.details})</span>}
                  </span>
                </div>
              ))}
            </div>
          </section>

        </div>

      </main>
    </div>
  );
};

export default Home;