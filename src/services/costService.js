/**
 * @file Service functions for interacting with the costs API.
 */

import { apiRequest } from './api';

const BASE_ENDPOINT = 'ccp/v1/costs';
const TRIAL_RECORDS_KEY = 'trialAnnualRecords';

/**
 * Checks if the user is in trial mode.
 *
 * @returns {boolean} True if in trial mode.
 */
const isTrialMode = () => {
	return localStorage.getItem('isTrialMode') === 'true';
};

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
	if (isTrialMode()) {
		const records = JSON.parse(localStorage.getItem(TRIAL_RECORDS_KEY) || '[]');
		const filtered = records.filter(r => r.project_id == projectId && r.campaign_id == campaignId && r.type === 'cost');
		// Transform back to the expected format
		const costs = filtered.map(r => ({
			id: r.id,
			project_id: r.project_id,
			campaign_id: r.campaign_id,
			category: r.category,
			details: r.details,
			total_amount: r.total_value,
			created_at: r.created_at,
			updated_at: r.updated_at,
		}));
		return Promise.resolve(costs);
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
	if (isTrialMode()) {
		const records = JSON.parse(localStorage.getItem(TRIAL_RECORDS_KEY) || '[]');
		const newRecord = {
			project_id: costData.project_id,
			campaign_id: costData.campaign_id,
			type: 'cost',
			category: costData.category,
			total_value: costData.total_amount,
			details: costData.details,
			id: Date.now() + Math.random(),
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};
		records.push(newRecord);
		localStorage.setItem(TRIAL_RECORDS_KEY, JSON.stringify(records));
		return Promise.resolve(newRecord);
	}
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
	if (isTrialMode()) {
		const records = JSON.parse(localStorage.getItem(TRIAL_RECORDS_KEY) || '[]');
		const index = records.findIndex(r => r.id == costId);
		if (index === -1) {
			return Promise.reject(new Error('Cost not found.'));
		}
		records[index] = {
			...records[index],
			category: costData.category || records[index].category,
			total_value: costData.total_amount || records[index].total_value,
			details: costData.details || records[index].details,
			updated_at: new Date().toISOString()
		};
		localStorage.setItem(TRIAL_RECORDS_KEY, JSON.stringify(records));
		// Return in the expected format
		const updated = records[index];
		return Promise.resolve({
			id: updated.id,
			project_id: updated.project_id,
			campaign_id: updated.campaign_id,
			category: updated.category,
			details: updated.details,
			total_amount: updated.total_value,
			created_at: updated.created_at,
			updated_at: updated.updated_at,
		});
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
	if (isTrialMode()) {
		const records = JSON.parse(localStorage.getItem(TRIAL_RECORDS_KEY) || '[]');
		const index = records.findIndex(r => r.id == costId);
		if (index !== -1) {
			records.splice(index, 1);
			localStorage.setItem(TRIAL_RECORDS_KEY, JSON.stringify(records));
		}
		return Promise.resolve({ deleted: true });
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