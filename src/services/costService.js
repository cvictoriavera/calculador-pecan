/**
 * @file Service functions for interacting with the costs API.
 */

import { apiRequest } from './api';

const BASE_ENDPOINT = 'ccp/v1/costs';

/**
 * Fetches costs for a specific campaign.
 *
 * @param {number} projectId - The ID of the project.
 * @param {number} campaignId - The ID of the campaign.
 * @returns {Promise<Array>} A promise that resolves to an array of cost objects.
 */
export const getCostsByCampaign = (projectId, campaignId) => {
	if (!projectId || !campaignId) {
		return Promise.reject(new Error('Project ID and Campaign ID are required.'));
	}
	return apiRequest(`${BASE_ENDPOINT}/${projectId}/${campaignId}`);
};

/**
 * Creates a new cost.
 *
 * @param {object} costData - The data for the new cost.
 * @param {number} costData.project_id - The ID of the project.
 * @param {number} costData.campaign_id - The ID of the campaign.
 * @param {string} costData.cost_type - The type of cost.
 * @param {object} [costData.cost_data] - The detailed cost data as JSON object.
 * @param {number} [costData.total_amount] - The total amount of the cost.
 * @returns {Promise<object>} A promise that resolves to the created cost object.
 */
export const createCost = (costData) => {
	return apiRequest(BASE_ENDPOINT, {
		method: 'POST',
		body: JSON.stringify(costData),
	});
};

export const createCostBatch = (costDataArray) => {
	return Promise.all(
		costDataArray.map(data => createCost(data))
	);
};

/**
 * Updates an existing cost.
 *
 * @param {number} costId - The ID of the cost to update.
 * @param {object} costData - The data to update.
 * @param {string} [costData.cost_type] - The type of cost.
 * @param {object} [costData.cost_data] - The detailed cost data as JSON object.
 * @param {number} [costData.total_amount] - The total amount of the cost.
 * @returns {Promise<object>} A promise that resolves to the update result.
 */
export const updateCost = (costId, costData) => {
	if (!costId) {
		return Promise.reject(new Error('Cost ID is required.'));
	}
	return apiRequest(`${BASE_ENDPOINT}/${costId}`, {
		method: 'PUT',
		body: JSON.stringify(costData),
	});
};

/**
 * Deletes a cost.
 *
 * @param {number} costId - The ID of the cost to delete.
 * @returns {Promise<object>} A promise that resolves to the delete result.
 */
export const deleteCost = (costId) => {
	if (!costId) {
		return Promise.reject(new Error('Cost ID is required.'));
	}
	return apiRequest(`${BASE_ENDPOINT}/${costId}`, {
		method: 'DELETE',
	});
};

export const updateCostBatch = (costDataArray) => {
	return Promise.all(
		costDataArray.map(data => updateCost(data.id, data))
	);
};