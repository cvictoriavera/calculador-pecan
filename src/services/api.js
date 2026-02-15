/**
 * @file Centralized API request handler for the React application.
 */



// 1. CORRECCIÓN DE NOMBRE:
// En el paso anterior configuramos PHP para enviar 'pecanSettings'.
// Si tu PHP envía 'pecanSettings' pero aquí buscas 'wpApiSettings', esto será undefined.
const settings = window.pecanSettings || window.wpApiSettings;

/**
 * The root URL of the WordPress REST API.
 */
const apiRoot = settings?.root ?? '/wp-json';

/**
 * The nonce for authenticating API requests.
 */
const apiNonce = settings?.nonce ?? '';

export const apiRequest = async (endpoint, options = {}) => {
    const url = `${apiRoot}${endpoint}`;


    const defaultHeaders = {
        'Content-Type': 'application/json',
        'X-WP-Nonce': apiNonce,
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
        // 2. CORRECCIÓN DE CREDENCIALES:
        // Esto es OBLIGATORIO para que WordPress sepa que eres el admin logueado.
        credentials: 'same-origin', 
    };

    try {
        const response = await fetch(url, config);

        

        if (!response.ok) {
            let errorText;
            try {
                errorText = await response.text();
                console.error('❌ API Error Response Text:', errorText);
                const errorData = JSON.parse(errorText);
                console.error('❌ API Error Parsed:', errorData);
            } catch (parseError) {
                console.error('❌ API Error: Response is not JSON, raw text:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - Response is HTML instead of JSON`);
            }

            throw new Error(errorData.message || 'Network response was not ok');
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
            const jsonData = await response.json();
            return jsonData;
        }
        const textData = await response.text();
        return textData;

    } catch (error) {
        console.error('☠️ Fetch Crash:', error);
        throw error;
    }
};