import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import EditExpense from './pages/EditExpense';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Accounts from './pages/Accounts';
import Layout from './components/Layout';

function App() {
  const { session } = useAuth();

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {!session ? (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/expenses/:id/edit" element={<EditExpense />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;