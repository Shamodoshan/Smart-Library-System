import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import StudentTopBar from '../../components/student/StudentTopBar';
import ReadOnlyBanner from '../../components/student/ReadOnlyBanner';
import StatsOverview from '../../components/student/StatsOverview';
import SeatMap from '../../components/student/SeatMap';
import SeatGrid from '../../components/student/SeatGrid';
import SeatDetailPanel from '../../components/student/SeatDetailPanel';
import ActivityFeed from '../../components/student/ActivityFeed';

const Home = () => {
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [logs, setLogs] = useState([]);
  const [profile, setProfile] = useState(null);
  const prevSeatsRef = useRef([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            setProfile({
              name: user.displayName || 'Student',
              email: user.email,
              studentId: 'N/A',
              rfid: 'N/A',
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setProfile(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'seats'),
      (snapshot) => {
        const fetchedSeats = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        fetchedSeats.sort((a, b) =>
          a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' })
        );

        const prevSeats = prevSeatsRef.current;
        if (prevSeats.length > 0) {
          fetchedSeats.forEach((seat) => {
            const prevSeat = prevSeats.find((s) => s.id === seat.id);
            if (prevSeat && prevSeat.status !== seat.status) {
              const timestamp = new Date().toLocaleTimeString();
              let logEvent = null;

              if (seat.status === 'reserved') {
                logEvent = {
                  time: timestamp,
                  type: 'seat_tap',
                  tag: 'reserved',
                  msg: `${seat.id.replace('_', ' ').toUpperCase()} reserved by admin`,
                  details: 'Assignment update',
                };
              } else if (seat.status === 'occupied') {
                logEvent = {
                  time: timestamp,
                  type: 'entrance_tap',
                  tag: 'check-in',
                  msg: `${seat.id.replace('_', ' ').toUpperCase()} now occupied`,
                  details: 'Student checked in',
                };
              } else if (seat.status === 'available') {
                logEvent = {
                  time: timestamp,
                  type: 'release',
                  tag: 'released',
                  msg: `${seat.id.replace('_', ' ').toUpperCase()} is available`,
                  details: `was ${prevSeat.status}`,
                };
              }

              if (logEvent) {
                setLogs((prev) => [logEvent, ...prev].slice(0, 50));
              }
            }
          });
        } else {
          const timestamp = new Date().toLocaleTimeString();
          setLogs([
            {
              time: timestamp,
              type: 'system',
              tag: 'system',
              msg: 'Connected to library monitor',
              details: `${fetchedSeats.length} seats synced`,
            },
          ]);
        }

        if (selectedSeat) {
          const updatedSelected = fetchedSeats.find((s) => s.id === selectedSeat.id);
          if (updatedSelected) setSelectedSeat(updatedSelected);
        }

        prevSeatsRef.current = fetchedSeats;
        setSeats(fetchedSeats);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        const timestamp = new Date().toLocaleTimeString();
        setLogs((prev) => [
          {
            time: timestamp,
            type: 'mismatch',
            tag: 'offline',
            msg: 'Unable to reach library server',
            details: error.message,
          },
          ...prev,
        ]);
      }
    );

    return () => unsubscribe();
  }, [selectedSeat]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const totalSeats = seats.length;
  const availableSeats = seats.filter((s) => s.status === 'available').length;
  const occupiedSeats = seats.filter((s) => s.status === 'occupied').length;
  const reservedSeats = seats.filter((s) => s.status === 'reserved').length;

  return (
    <div className="student-page">
      <StudentTopBar profile={profile} onLogout={handleLogout} />

      <main className="student-main">
        <ReadOnlyBanner />

        <StatsOverview
          total={totalSeats}
          available={availableSeats}
          occupied={occupiedSeats}
          reserved={reservedSeats}
        />

        <div className="student-dashboard-grid">
          <div className="seat-visual-section">
            <SeatGrid
              seats={seats}
              selectedSeat={selectedSeat}
              onSeatSelect={setSelectedSeat}
            />
            <SeatMap
              seats={seats}
              selectedSeat={selectedSeat}
              onSeatSelect={setSelectedSeat}
            />
          </div>

          <aside className="student-sidebar">
            <SeatDetailPanel seat={selectedSeat} />
            <ActivityFeed logs={logs} />
          </aside>
        </div>
      </main>

      <p className="student-footer-note">
        Need a seat? Visit the library help desk — an admin will assign an available seat for you.
      </p>
    </div>
  );
};

export default Home;
