import React from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Aquí irá la lógica de login posteriormente
        console.log('Intento de login');
        // Por ahora solo registramos el intento de login
        // Posteriormente aquí irá la validación real
    };

    return (
        <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="card shadow" style={{ width: '350px' }}>
                <div className="card-header bg-primary text-white">
                    <h4 className="mb-0">Bienvenido</h4>
                </div>
                <div className="card-body">
                    <p className="card-text text-muted mb-4">
                        Ingresa a tu cuenta para ver tu portfolio
                    </p>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                placeholder="nombre@ejemplo.com"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">Contraseña</label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100">
                            Ingresar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;

