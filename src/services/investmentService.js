/**
 * @file Service functions for interacting with the investments API.
 */

import { apiRequest } from './api';

const BASE_ENDPOINT = 'ccp/v1/investments';
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
 * Fetches all investments for a given project.
 *
 * @param {number} projectId - The ID of the project.
 * @returns {Promise<Array>} A promise that resolves to an array of investment objects.
 */
export const getInvestmentsByProject = (projectId) => {
	if (!projectId) {
		return Promise.reject(new Error('Project ID is required.'));
	}
	return apiRequest(`${BASE_ENDPOINT}/${projectId}`);
};

/**
 * Fetches investments for a specific campaign.
 *
 * @param {number} projectId - The ID of the project.
 * @param {number} campaignId - The ID of the campaign.
 * @returns {Promise<Array>} A promise that resolves to an array of investment objects.
 */
export const getInvestmentsByCampaign = (projectId, campaignId) => {
	if (!projectId || !campaignId) {
		return Promise.reject(new Error('Project ID and Campaign ID are required.'));
	}
	if (isTrialMode()) {
		const records = JSON.parse(localStorage.getItem(TRIAL_RECORDS_KEY) || '[]');
		const filtered = records.filter(r => r.project_id == projectId && r.campaign_id == campaignId && r.type === 'investment');
		return Promise.resolve(filtered);
	}
	return apiRequest(`${BASE_ENDPOINT}/${projectId}/${campaignId}`);
};

/**
 * Fetches investments for multiple campaigns in batch.
 *
 * @param {number} projectId - The ID of the project.
 * @param {number[]} campaignIds - Array of campaign IDs.
 * @returns {Promise<Object>} A promise that resolves to an object with campaign IDs as keys and investment arrays as values.
 */
export const getInvestmentsBatch = (projectId, campaignIds) => {
	if (!projectId || !Array.isArray(campaignIds) || campaignIds.length === 0) {
		return Promise.reject(new Error('Project ID and campaign IDs array are required.'));
	}
	if (isTrialMode()) {
		const records = JSON.parse(localStorage.getItem(TRIAL_RECORDS_KEY) || '[]');
		const grouped = {};

		campaignIds.forEach(campaignId => {
			const filtered = records.filter(r =>
				r.project_id == projectId &&
				r.campaign_id == campaignId &&
				r.type === 'investment'
			);
			grouped[campaignId] = filtered;
		});

		return Promise.resolve(grouped);
	}

	const params = new URLSearchParams({
		project_id: projectId.toString(),
		campaign_ids: campaignIds.join(',')
	});

	return apiRequest(`${BASE_ENDPOINT}/batch?${params}`);
};

/**
 * Creates a new investment.
 *
 * @param {object} investmentData - The data for the new investment.
 * @param {number} investmentData.project_id - The ID of the project.
 * @param {number} [investmentData.campaign_id] - The ID of the campaign.
 * @param {string} investmentData.category - The category of the investment.
 * @param {string} investmentData.description - The description of the investment.
 * @param {number} [investmentData.total_value] - The total value of the investment.
 * @param {object} [investmentData.details] - Additional details as JSON object.
 * @returns {Promise<object>} A promise that resolves to the created investment object.
 */
export const createInvestment = (investmentData) => {
	if (isTrialMode()) {
		// For trial mode, return fake result without API call
		return Promise.resolve({
			id: Date.now() + Math.random(),
			...investmentData,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		});
	}
	return apiRequest(BASE_ENDPOINT, {
		method: 'POST',
		body: JSON.stringify(investmentData),
	});
};

/**
 * Updates an existing investment.
 *
 * @param {number} investmentId - The ID of the investment to update.
 * @param {object} investmentData - The data to update.
 * @param {string} [investmentData.category] - The category of the investment.
 * @param {string} [investmentData.description] - The description of the investment.
 * @param {number} [investmentData.total_value] - The total value of the investment.
 * @param {object} [investmentData.details] - Additional details as JSON object.
 * @returns {Promise<object>} A promise that resolves to the update result.
 */
export const updateInvestment = (investmentId, investmentData) => {
	if (!investmentId) {
		return Promise.reject(new Error('Investment ID is required.'));
	}
	if (isTrialMode()) {
		// For trial mode, return fake result without API call
		return Promise.resolve({
			id: investmentId,
			...investmentData,
			updated_at: new Date().toISOString(),
		});
	}
	return apiRequest(`${BASE_ENDPOINT}/${investmentId}`, {
		method: 'PUT',
		body: JSON.stringify(investmentData),
	});
};

/**
 * Deletes an investment.
 *
 * @param {number} investmentId - The ID of the investment to delete.
 * @returns {Promise<object>} A promise that resolves to the delete result.
 */
export const deleteInvestment = (investmentId) => {
	if (!investmentId) {
		return Promise.reject(new Error('Investment ID is required.'));
	}
	if (isTrialMode()) {
		// For trial mode, return fake result without API call
		return Promise.resolve({ deleted: true });
	}
	return apiRequest(`${BASE_ENDPOINT}/${investmentId}`, {
		method: 'DELETE',
	});
};