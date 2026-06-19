import React from 'react';
import { Button } from 'react-bootstrap';

const UserInfo = ({ profile, onLogout }) => (
  <div className="d-flex align-items-center gap-3">
    <div className="text-end">
      <div className="fw-bold" style={{ color: 'var(--text-primary)' }}>{profile?.name || 'Student'}</div>
      <div className="small text-muted">
        ID: <span className="fw-bold text-primary">{profile?.studentId || 'N/A'}</span> |
        RFID: <span className="fw-bold text-primary">{profile?.rfid || 'N/A'}</span>
      </div>
    </div>
    <Button variant="secondary" size="sm" onClick={onLogout}>Sign Out</Button>
  </div>
);

export default UserInfo;
