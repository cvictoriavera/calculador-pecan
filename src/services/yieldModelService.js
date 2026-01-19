/**
 * @file Service functions for interacting with the yield models API.
 */

import { apiRequest } from './api';

const BASE_ENDPOINT = 'ccp/v1/yield-models';

/**
 * Checks if the user is in trial mode.
 *
 * @returns {boolean} True if in trial mode.
 */
const isTrialMode = () => {
	return localStorage.getItem('isTrialMode') === 'true';
};

/**
 * Fetches all yield models for a given project.
 *
 * @param {number} projectId - The ID of the project.
 * @returns {Promise<Array>} A promise that resolves to an array of yield model objects.
 */
export const getYieldModelsByProject = (projectId) => {
	if (!projectId) {
		return Promise.reject(new Error('Project ID is required.'));
	}
	if (isTrialMode()) {
		// For trial mode, load from localStorage
		const stored = localStorage.getItem(`yield_models_project_${projectId}`);
		return Promise.resolve(stored ? JSON.parse(stored) : []);
	}
	return apiRequest(`${BASE_ENDPOINT}/by-project/${projectId}`);
};

/**
 * Creates a new yield model.
 *
 * @param {object} yieldModelData - The data for the new yield model.
 * @param {number} yieldModelData.project_id - The ID of the project.
 * @param {string} [yieldModelData.variety] - The variety (defaults to 'general').
 * @param {string} yieldModelData.model_name - The name of the model.
 * @param {string} yieldModelData.yield_data - The JSON string of yield data.
 * @param {number} [yieldModelData.is_active] - Whether the model is active.
 * @returns {Promise<object>} A promise that resolves to the created yield model object.
 */
export const createYieldModel = (yieldModelData) => {
	if (isTrialMode()) {
		// For trial mode, save to localStorage
		const projectId = yieldModelData.project_id;
		const stored = localStorage.getItem(`yield_models_project_${projectId}`);
		const models = stored ? JSON.parse(stored) : [];
		const newModel = { ...yieldModelData, id: Date.now() }; // fake id
		models.push(newModel);
		localStorage.setItem(`yield_models_project_${projectId}`, JSON.stringify(models));
		return Promise.resolve(newModel);
	}
	return apiRequest(BASE_ENDPOINT, {
		method: 'POST',
		body: JSON.stringify(yieldModelData),
	});
};

/**
 * Updates an existing yield model.
 *
 * @param {number} modelId - The ID of the yield model to update.
 * @param {object} yieldModelData - The data to update.
 * @param {string} [yieldModelData.model_name] - The name of the model.
 * @param {string} [yieldModelData.yield_data] - The JSON string of yield data.
 * @param {number} [yieldModelData.is_active] - Whether the model is active.
 * @returns {Promise<object>} A promise that resolves to the updated yield model object.
 */
export const updateYieldModel = (modelId, yieldModelData) => {
	if (!modelId) {
		return Promise.reject(new Error('Model ID is required.'));
	}
	if (isTrialMode()) {
		// For trial mode, update in localStorage
		// Find the project_id from all stored models
		let projectId = null;
		const keys = Object.keys(localStorage);
		for (const key of keys) {
			if (key.startsWith('yield_models_project_')) {
				const stored = localStorage.getItem(key);
				const models = stored ? JSON.parse(stored) : [];
				const model = models.find(m => m.id == modelId);
				if (model) {
					projectId = model.project_id;
					break;
				}
			}
		}
		if (!projectId) {
			return Promise.reject(new Error('Yield model not found in localStorage.'));
		}
		const stored = localStorage.getItem(`yield_models_project_${projectId}`);
		const models = stored ? JSON.parse(stored) : [];
		const index = models.findIndex(m => m.id == modelId);
		models[index] = { ...models[index], ...yieldModelData, updated_at: new Date().toISOString() };
		localStorage.setItem(`yield_models_project_${projectId}`, JSON.stringify(models));
		return Promise.resolve(models[index]);
	}
	return apiRequest(`${BASE_ENDPOINT}/${modelId}`, {
		method: 'PUT',
		body: JSON.stringify(yieldModelData),
	});
};

/**
 * Deletes a yield model.
 *
 * @param {number} modelId - The ID of the yield model to delete.
 * @returns {Promise<void>} A promise that resolves when the model is deleted.
 */
export const deleteYieldModel = (modelId) => {
	if (!modelId) {
		return Promise.reject(new Error('Model ID is required.'));
	}
	if (isTrialMode()) {
		// For trial mode, delete from localStorage
		let projectId = null;
		const keys = Object.keys(localStorage);
		for (const key of keys) {
			if (key.startsWith('yield_models_project_')) {
				const stored = localStorage.getItem(key);
				const models = stored ? JSON.parse(stored) : [];
				const model = models.find(m => m.id == modelId);
				if (model) {
					projectId = model.project_id;
					break;
				}
			}
		}
		if (!projectId) {
			return Promise.reject(new Error('Yield model not found in localStorage.'));
		}
		const stored = localStorage.getItem(`yield_models_project_${projectId}`);
		let models = stored ? JSON.parse(stored) : [];
		models = models.filter(m => m.id != modelId);
		localStorage.setItem(`yield_models_project_${projectId}`, JSON.stringify(models));
		return Promise.resolve();
	}
	return apiRequest(`${BASE_ENDPOINT}/${modelId}`, {
		method: 'DELETE',
	});
};