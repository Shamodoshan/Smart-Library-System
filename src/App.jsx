import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import Home from "./pages/student/Home";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

// A route wrapper that redirects to /login if not authenticated
const ProtectedRoute = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)',
        fontSize: '1rem',
        fontWeight: '600'
      }}>
        Initializing Security Sync...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RoleRouter = () => {
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setLoadingRole(false);
        return;
      }

      try {
        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        const profile = profileDoc.exists() ? profileDoc.data() : { role: 'student' };
        setRole(profile.role || 'student');
      } catch (error) {
        console.error('Failed to load user role:', error);
        setRole('student');
      } finally {
        setLoadingRole(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loadingRole) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)',
        fontSize: '1rem',
        fontWeight: '600'
      }}>
        Loading dashboard…
      </div>
    );
  }

  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Home />;
};

const AdminRoute = ({ children }) => {
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setLoadingRole(false);
        return;
      }

      try {
        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        const profile = profileDoc.exists() ? profileDoc.data() : { role: 'student' };
        setRole(profile.role || 'student');
      } catch (error) {
        console.error('Failed to load user role:', error);
        setRole('student');
      } finally {
        setLoadingRole(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loadingRole) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)',
        fontSize: '1rem',
        fontWeight: '600'
      }}>
        Verifying admin access…
      </div>
    );
  }

  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Role-aware landing route */}
        <Route path="/" element={
          <ProtectedRoute>
            <RoleRouter />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          </ProtectedRoute>
        } />
        
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
