// authInterceptor.js
import { API_URL } from './api.js';

const API_BASE_URL = API_URL; // Usa a URL da sua API

export function configureInterceptor() {
    const originalFetch = window.fetch;

    window.fetch = async (input, init = {}) => {
        // Verifica se é uma requisição para nossa API
        const isApiRequest = typeof input === 'string' && input.startsWith(API_BASE_URL);
        
        if (isApiRequest) {
            const token = localStorage.getItem('jwtToken');
            
            if (!token) {
                window.location.href = 'login.html';
                return Promise.reject('Token não encontrado');
            }

            // Configura os headers
            const headers = new Headers(init.headers || {});
            headers.set('Authorization', `Bearer ${token}`);
            headers.set('Content-Type', 'application/json');

            init.headers = headers;
        }

        return originalFetch(input, init)
            .then(response => {
                if (response.status === 401) {
                    localStorage.removeItem('jwtToken');
                    window.location.href = 'login.html';
                }
                return response;
            });
    };
}