/**
 * @file Centralized API request handler for the React application.
 *
 * This module provides a wrapper around the native `fetch` API to streamline
 * communication with the WordPress REST API. It automatically includes the
 * API root URL and the nonce for authentication.
 */

/**
 * The root URL of the WordPress REST API.
 * @type {string}
 */
const apiRoot = window.wpApiSettings?.root ?? '';

/**
 * The nonce for authenticating API requests.
 * @type {string}
 */
const apiNonce = window.wpApiSettings?.nonce ?? '';

/**
 * Performs an authenticated API request.
 *
 * @param {string} endpoint - The API endpoint to call (e.g., 'ccp/v1/projects').
 * @param {object} [options={}] - Optional. The options object for the `fetch` call.
 * @returns {Promise<any>} A promise that resolves with the JSON response.
 * @throws {Error} If the network response is not ok.
 */
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
	};

	const response = await fetch(url, config);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({
			message: 'An unknown error occurred.',
		}));
		throw new Error(errorData.message || 'Network response was not ok');
	}

	// If the response has no content, return null.
	const contentType = response.headers.get('content-type');
	if (contentType && contentType.indexOf('application/json') !== -1) {
		return response.json();
	}
	return null;
};
