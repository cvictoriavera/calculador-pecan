/**
 * @file Service functions for interacting with the projects API.
 */

import { apiRequest } from './api';

const BASE_ENDPOINT = 'ccp/v1/projects';

/**
 * Fetches all projects for the current user.
 *
 * @returns {Promise<Array>} A promise that resolves to an array of project objects.
 */
export const getProjects = () => {
	return apiRequest(BASE_ENDPOINT);
};

/**
 * Fetches a single project by its ID.
 *
 * @param {number} projectId - The ID of the project.
 * @returns {Promise<object>} A promise that resolves to the project object.
 */
export const getProjectById = (projectId) => {
	if (!projectId) {
		return Promise.reject(new Error('Project ID is required.'));
	}
	return apiRequest(`${BASE_ENDPOINT}/${projectId}`);
};

/**
 * Creates a new project.
 *
 * @param {object} projectData - The data for the new project.
 * @param {string} projectData.project_name - The name of the project.
 * @param {string} [projectData.description] - Optional. The description of the project.
 * @returns {Promise<object>} A promise that resolves to the newly created project object.
 */
export const createProject = (projectData) => {
	return apiRequest(BASE_ENDPOINT, {
		method: 'POST',
		body: JSON.stringify(projectData),
	});
};

/**
 * Updates an existing project.
 *
 * @param {number} projectId - The ID of the project to update.
 * @param {object} projectData - The data to update.
 * @param {string} [projectData.pais] - The country.
 * @param {string} [projectData.provincia] - The province.
 * @param {string} [projectData.descripcion] - The description.
 * @returns {Promise<object>} A promise that resolves to the updated project object.
 */
export const updateProject = (projectId, projectData) => {
	return apiRequest(`${BASE_ENDPOINT}/${projectId}`, {
		method: 'PUT',
		body: JSON.stringify(projectData),
	});
};
