import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';

function App() {
    // Por ahora, siempre será false hasta que implementemos autenticación
    const isAuthenticated = false;

    // Componente para proteger rutas
    const ProtectedRoute = ({ children }) => {
        if (!isAuthenticated) {
            return <Navigate to="/login" replace />;
        }
        return children;
    };

    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/login" element={
                        isAuthenticated ? <Navigate to="/" replace /> : <Login />
                    } />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    } />
                </Routes>
            </div>
        </Router>
    );
}

export default App;

