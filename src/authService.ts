import { api, setAuth } from './api';

export const authService = {
    // Función para iniciar sesión
    login: async (credentials: { email: string; password: string }) => {
        const response = await api.post('/login', credentials);
        // Si el login es exitoso, guardamos el token de una vez
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            setAuth(response.data.token);
        }
        return response.data;
    },

    // Función para registrar un nuevo cliente
    register: async (userData: any) => {
        const response = await api.post('/register', userData);
        return response.data;
    },

    // Función para obtener los datos del perfil del cliente logueado
    getPerfil: async () => {
        const response = await api.get('/perfil');
        return response.data;
    },

    // Cerrar sesión
    logout: () => {
        localStorage.removeItem('token');
        setAuth(null);
        window.location.href = '/login';
    }
};