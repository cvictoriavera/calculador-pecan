/**
 * @file Service functions for interacting with the projects API.
 */

import { apiRequest } from './api';

const BASE_ENDPOINT = 'ccp/v1/projects';
const TRIAL_PROJECTS_KEY = 'trialProjects';

/**
 * Checks if the user is in trial mode.
 *
 * @returns {boolean} True if in trial mode.
 */
const isTrialMode = () => {
	return localStorage.getItem('isTrialMode') === 'true';
};

/**
 * Fetches all projects for the current user.
 *
 * @returns {Promise<Array>} A promise that resolves to an array of project objects.
 */
export const getProjects = () => {
	if (isTrialMode()) {
		// Return projects from localStorage
		const projects = JSON.parse(localStorage.getItem(TRIAL_PROJECTS_KEY) || '[]');
		return Promise.resolve(projects);
	}
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
	if (isTrialMode()) {
		const projects = JSON.parse(localStorage.getItem(TRIAL_PROJECTS_KEY) || '[]');
		const project = projects.find(p => p.id == projectId);
		if (!project) {
			return Promise.reject(new Error('Project not found.'));
		}
		return Promise.resolve(project);
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
	if (isTrialMode()) {
		// Create project in localStorage
		const projects = JSON.parse(localStorage.getItem(TRIAL_PROJECTS_KEY) || '[]');
		const newProject = {
			id: Date.now(), // Use timestamp as ID
			user_id: 0, // Dummy
			project_name: projectData.project_name || 'Nuevo Proyecto',
			description: projectData.description || '',
			pais: projectData.pais || '',
			provincia: projectData.provincia || '',
			departamento: projectData.departamento || '',
			municipio: projectData.municipio || '',
			status: 'active',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};
		projects.push(newProject);
		localStorage.setItem(TRIAL_PROJECTS_KEY, JSON.stringify(projects));
		return Promise.resolve(newProject);
	}
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
	if (isTrialMode()) {
		const projects = JSON.parse(localStorage.getItem(TRIAL_PROJECTS_KEY) || '[]');
		const index = projects.findIndex(p => p.id == projectId);
		if (index === -1) {
			return Promise.reject(new Error('Project not found.'));
		}
		projects[index] = { ...projects[index], ...projectData, updated_at: new Date().toISOString() };
		localStorage.setItem(TRIAL_PROJECTS_KEY, JSON.stringify(projects));
		return Promise.resolve(projects[index]);
	}
	return apiRequest(`${BASE_ENDPOINT}/${projectId}`, {
		method: 'PUT',
		body: JSON.stringify(projectData),
	});
};
