/**
 * @file Service functions for interacting with the campaigns API.
 */

import { apiRequest } from './api';

const BASE_ENDPOINT = 'ccp/v1/campaigns';

/**
 * Fetches all campaigns for a given project.
 *
 * @param {number} projectId - The ID of the project.
 * @returns {Promise<Array>} A promise that resolves to an array of campaign objects.
 */
export const getCampaignsByProject = (projectId) => {
	if (!projectId) {
		return Promise.reject(new Error('Project ID is required.'));
	}
	return apiRequest(`${BASE_ENDPOINT}/by-project/${projectId}`);
};
