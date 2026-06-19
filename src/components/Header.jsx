import React from 'react';

const Header = ({ title, subtitle }) => (
  <header className="d-flex align-items-center gap-3 mb-3">
    <div className="student-logo" aria-hidden="true">
      <span>L</span>
    </div>
    <div>
      <h1 className="h5 mb-0 text-primary" style={{ fontWeight: 800 }}>{title}</h1>
      {subtitle && <p className="small text-muted mb-0">{subtitle}</p>}
    </div>
  </header>
);

export default Header;
