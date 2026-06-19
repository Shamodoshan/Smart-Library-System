import React from 'react';

const StudentTopBar = ({ profile, onLogout }) => {
  const initials = (profile?.name || 'S')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="student-topbar">
      <div className="student-topbar-row">
        <div className="student-topbar-brand">
          <div className="student-logo" aria-hidden="true">
            <span>L</span>
          </div>
          <div className="student-brand-text">
            <h1>Smart Library</h1>
            <p>Student Portal</p>
          </div>
          <span className="readonly-badge">View Only</span>
        </div>
      </div>

      <div className="student-topbar-row student-topbar-user-row">
        <div className="student-user-card">
          <div className="student-avatar" aria-hidden="true">{initials}</div>
          <div className="student-user-meta">
            <div className="student-user-name">{profile?.name || 'Student'}</div>
            <div className="student-user-id">
              <span>ID: {profile?.studentId || 'N/A'}</span>
              {profile?.rfid && profile.rfid !== 'N/A' && (
                <span className="student-user-rfid">RFID: {profile.rfid}</span>
              )}
            </div>
          </div>
        </div>

        <button type="button" className="btn btn-secondary" onClick={onLogout}>
          Sign Out
        </button>
      </div>
    </header>
  );
};

export default StudentTopBar;
