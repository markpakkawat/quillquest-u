import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import './assets/css/App.css';
import ProtectedRoute from './components/ProtectedRoute';
import AuthenticatedRoute from './components/AuthenticatedRoute';
import ResetPassword from './pages/ResetPassword';
import ResetPasswordForm from './pages/ResetPasswordForm';
import EssayGuidance from './pages/EssayGuidance';
import EssayBuilder from './pages/EssayBuilder';
import EssayBlock from './pages/EssayBlock';
import { EssayReview } from './components/EssayReview';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/reset-password/:token" element={<ResetPasswordForm />} />
          <Route path='/reset-password' element={<ResetPassword />} />
          
          {/* Prevent access to login/register if already logged in */}
          <Route path="/" element={<AuthenticatedRoute><Login /></AuthenticatedRoute>} />
          <Route path="/login" element={<AuthenticatedRoute><Login /></AuthenticatedRoute>} />
          <Route path="/register" element={<AuthenticatedRoute><Register /></AuthenticatedRoute>} />

          {/* Protected routes for authenticated users only */}

          <Route path="/essayguidance" element={<ProtectedRoute><EssayGuidance /></ProtectedRoute>} />
          <Route path="/essaybuilder" element={<ProtectedRoute><EssayBuilder /></ProtectedRoute>} />
          <Route path="/essayblock/:sectionId" element={<ProtectedRoute><EssayBlock /></ProtectedRoute>} />
          <Route path="/essayreview" element={<ProtectedRoute><EssayReview /></ProtectedRoute>} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path='/profile' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path='/createpost' element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
          <Route path='/posts/:id' element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;