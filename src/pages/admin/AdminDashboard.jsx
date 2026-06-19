import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import StatsOverview from '../../components/student/StatsOverview';
import SeatGrid from '../../components/student/SeatGrid';
import SeatMap from '../../components/student/SeatMap';

const formatSeatLabel = (seatId) => seatId.replace('_', ' ').toUpperCase();

const AdminDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [seats, setSeats] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [logs, setLogs] = useState([]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        const userProfile = profileDoc.exists()
          ? profileDoc.data()
          : {
              name: user.displayName || 'Admin',
              email: user.email,
              role: 'admin',
            };

        setProfile(userProfile);
        if (userProfile.role !== 'admin') {
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to load admin profile:', error);
      }
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'seats'),
      (snapshot) => {
        const seatRecords = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));

        if (selectedSeat) {
          const updatedSeat = seatRecords.find((seat) => seat.id === selectedSeat.id);
          if (updatedSeat) {
            setSelectedSeat(updatedSeat);
          }
        }

        setSeats(seatRecords);
      },
      (error) => {
        console.error('Seat subscription failed:', error);
      }
    );

    return () => unsubscribe();
  }, [selectedSeat]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const profileRecords = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .filter((user) => user.role !== 'admin');

        setStudents(profileRecords);
      },
      (error) => {
        console.error('User subscription failed:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const assignSeat = async () => {
    if (!selectedSeat || !selectedStudentId) {
      return;
    }

    setSaving(true);
    try {
      const selectedStudent = students.find((student) => student.id === selectedStudentId);
      const seatRef = doc(db, 'seats', selectedSeat.id);
      const studentRef = doc(db, 'users', selectedStudentId);
      const assignedAt = new Date().toISOString();

      if (selectedSeat.assignedTo && selectedSeat.assignedTo !== selectedStudentId) {
        const priorUserRef = doc(db, 'users', selectedSeat.assignedTo);
        await updateDoc(priorUserRef, {
          assignedSeat: deleteField(),
          seatStatus: deleteField(),
          assignedAt: deleteField(),
        });
      }

      await updateDoc(seatRef, {
        status: 'reserved',
        assignedTo: selectedStudentId,
        assignedName: selectedStudent?.name || null,
        assignedAt,
      });

      await updateDoc(studentRef, {
        assignedSeat: selectedSeat.id,
        seatStatus: 'reserved',
        assignedAt,
      });

      setLogs((prevLogs) => [
        {
          time: new Date().toLocaleTimeString(),
          type: 'assign',
          tag: 'assignment',
          msg: `${formatSeatLabel(selectedSeat.id)} reserved for ${selectedStudent?.name || 'student'}`,
          details: `by ${profile?.name || 'Admin'}`,
        },
        ...prevLogs,
      ].slice(0, 50));
      setSelectedStudentId('');
    } catch (error) {
      console.error('Assignment failed:', error);
      setLogs((prevLogs) => [
        {
          time: new Date().toLocaleTimeString(),
          type: 'mismatch',
          tag: 'error',
          msg: `Failed to assign ${formatSeatLabel(selectedSeat?.id || 'seat')}`,
          details: error.message,
        },
        ...prevLogs,
      ].slice(0, 50));
    } finally {
      setSaving(false);
    }
  };

  const releaseSeat = async () => {
    if (!selectedSeat) {
      return;
    }

    setSaving(true);
    try {
      const seatRef = doc(db, 'seats', selectedSeat.id);
      if (selectedSeat.assignedTo) {
        const studentRef = doc(db, 'users', selectedSeat.assignedTo);
        await updateDoc(studentRef, {
          assignedSeat: deleteField(),
          seatStatus: deleteField(),
          assignedAt: deleteField(),
        });
      }

      await updateDoc(seatRef, {
        status: 'available',
        assignedTo: deleteField(),
        assignedName: deleteField(),
        assignedAt: deleteField(),
      });

      setLogs((prevLogs) => [
        {
          time: new Date().toLocaleTimeString(),
          type: 'release',
          tag: 'release',
          msg: `${formatSeatLabel(selectedSeat.id)} released to available`,
          details: `by ${profile?.name || 'Admin'}`,
        },
        ...prevLogs,
      ].slice(0, 50));
      setSelectedStudentId('');
    } catch (error) {
      console.error('Release failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const totalSeats = seats.length;
  const availableSeats = seats.filter((seat) => seat.status === 'available').length;
  const occupiedSeats = seats.filter((seat) => seat.status === 'occupied').length;
  const reservedSeats = seats.filter((seat) => seat.status === 'reserved').length;

  const assignmentHint = selectedSeat?.status === 'available'
    ? 'Select a student and assign this seat.'
    : selectedSeat?.status === 'reserved'
      ? 'Release or reassign this reserved seat.'
      : 'Occupied seats can be returned to available once the student leaves.';

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <div className="admin-topbar-row">
          <div className="admin-topbar-brand">
            <div className="student-logo" aria-hidden="true">
              <span>L</span>
            </div>
            <div className="admin-brand-text">
              <h1>Smart Library</h1>
              <p>Admin Dashboard</p>
            </div>
          </div>
          <div className="admin-user-actions">
            <div>
              <div className="admin-user-name">{profile?.name || 'Admin'}</div>
              <div className="admin-user-meta">{profile?.email || 'administrator'}</div>
            </div>
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <StatsOverview
          total={totalSeats}
          available={availableSeats}
          occupied={occupiedSeats}
          reserved={reservedSeats}
        />

        <div className="admin-dashboard-grid">
          <section className="seat-visual-section">
            <SeatGrid seats={seats} selectedSeat={selectedSeat} onSeatSelect={setSelectedSeat} />
            <SeatMap seats={seats} selectedSeat={selectedSeat} onSeatSelect={setSelectedSeat} />
          </section>

          <aside className="admin-sidebar">
            <section className="student-panel admin-seat-detail-panel">
              <div className="student-panel-header">
                <div>
                  <h2 className="student-panel-title">Seat Assignment</h2>
                  <p className="student-panel-subtitle">Assign students to available seats and manage reservations.</p>
                </div>
              </div>

              {!selectedSeat ? (
                <p className="admin-note">Choose a seat from the list to begin assignment or release.</p>
              ) : (
                <div className="admin-seat-info">
                  <div className="seat-detail-row">
                    <span className="seat-detail-label">Selected Seat</span>
                    <span className="seat-detail-value">{formatSeatLabel(selectedSeat.id)}</span>
                  </div>
                  <div className="seat-detail-row">
                    <span className="seat-detail-label">Status</span>
                    <span className={`badge badge-${selectedSeat.status}`}>{selectedSeat.status}</span>
                  </div>
                  <div className="seat-detail-row">
                    <span className="seat-detail-label">Assigned To</span>
                    <span className="seat-detail-value">
                      {selectedSeat.assignedName || 'Not assigned'}
                    </span>
                  </div>
                  <p className="admin-note">{assignmentHint}</p>

                  {selectedSeat.status === 'available' && (
                    <div className="assignment-form">
                      <label className="form-label">Student</label>
                      <select
                        className="form-control"
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                      >
                        <option value="">Choose a student</option>
                        {students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name} — {student.studentId || student.email}
                          </option>
                        ))}
                      </select>
                      <div className="assignment-actions">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={assignSeat}
                          disabled={!selectedStudentId || saving}
                        >
                          {saving ? 'Saving…' : 'Assign Seat'}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedSeat.status !== 'available' && (
                    <div className="assignment-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={releaseSeat}
                        disabled={saving}
                      >
                        {saving ? 'Saving…' : 'Release Seat'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="student-panel admin-student-list-panel">
              <div className="student-panel-header">
                <div>
                  <h2 className="student-panel-title">Student Roster</h2>
                  <p className="student-panel-subtitle">View all registered students and their current seating status.</p>
                </div>
              </div>

              <div className="student-table-wrap">
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="admin-note">Loading student profiles…</td>
                      </tr>
                    ) : (
                      students.map((student) => (
                        <tr key={student.id}>
                          <td>{student.name || student.email}</td>
                          <td>
                            {student.assignedSeat ? (
                              <span className="badge badge-reserved">{student.assignedSeat}</span>
                            ) : (
                              <span className="badge badge-available">No seat</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="student-panel admin-activity-panel">
              <div className="student-panel-header">
                <div>
                  <h2 className="student-panel-title">Operations Log</h2>
                  <p className="student-panel-subtitle">Recent admin seat assignments and releases.</p>
                </div>
              </div>
              <div className="activity-feed">
                {logs.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', padding: '0.5rem' }}>No recent admin actions yet.</p>
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
          </aside>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
