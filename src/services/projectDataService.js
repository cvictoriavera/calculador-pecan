/**
 * @file Service functions for interacting with the annual records API.
 */

import { apiRequest } from './api';

const BASE_ENDPOINT = 'ccp/v1/annual-records';
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
 * Fetches all records for a specific campaign.
 *
 * @param {number} projectId - The ID of the project.
 * @param {number} campaignId - The ID of the campaign.
 * @returns {Promise<Array>} A promise that resolves to an array of record objects.
 */
export const getAnnualRecords = (projectId, campaignId) => {
	if (!projectId || !campaignId) {
		return Promise.reject(new Error('Project ID and Campaign ID are required.'));
	}
	if (isTrialMode()) {
		const records = JSON.parse(localStorage.getItem(TRIAL_RECORDS_KEY) || '[]');
		const filtered = records.filter(r => r.project_id == projectId && r.campaign_id == campaignId);
		return Promise.resolve(filtered);
	}
	return apiRequest(`${BASE_ENDPOINT}/${projectId}/${campaignId}`);
};

/**
 * Fetches records by type for a specific campaign.
 *
 * @param {number} projectId - The ID of the project.
 * @param {number} campaignId - The ID of the campaign.
 * @param {string} type - The type of records ('production', 'investment', 'cost').
 * @returns {Promise<Array>} A promise that resolves to an array of record objects.
 */
export const getRecordsByType = (projectId, campaignId, type) => {
	if (!projectId || !campaignId || !type) {
		return Promise.reject(new Error('Project ID, Campaign ID, and type are required.'));
	}
	if (isTrialMode()) {
		const records = JSON.parse(localStorage.getItem(TRIAL_RECORDS_KEY) || '[]');
		const filtered = records.filter(r => r.project_id == projectId && r.campaign_id == campaignId && r.type === type);
		return Promise.resolve(filtered);
	}
	return apiRequest(`${BASE_ENDPOINT}/${projectId}/${campaignId}/${type}`);
};

/**
 * Saves an annual record.
 *
 * @param {object} data - The data to save.
 * @param {number} data.project_id - The ID of the project.
 * @param {number} data.campaign_id - The ID of the campaign.
 * @param {string} data.type - The type of record ('production', 'investment', 'cost').
 * @param {string} data.category - The category of the record.
 * @param {number} data.total_value - The total value.
 * @param {object} data.details - The details object.
 * @returns {Promise<object>} A promise that resolves to the API response.
 */
export const saveAnnualRecord = (data) => {
	if (isTrialMode()) {
		const records = JSON.parse(localStorage.getItem(TRIAL_RECORDS_KEY) || '[]');
		const newRecord = {
			...data,
			id: Date.now(), // Dummy ID
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};
		records.push(newRecord);
		localStorage.setItem(TRIAL_RECORDS_KEY, JSON.stringify(records));
		return Promise.resolve(newRecord);
	}
	return apiRequest(BASE_ENDPOINT, {
		method: 'POST',
		body: JSON.stringify(data),
	});
};

/**
 * Deletes an annual record.
 *
 * @param {number} projectId - The ID of the project.
 * @param {number} campaignId - The ID of the campaign.
 * @param {string} type - The type of record.
 * @param {string} category - The category of the record.
 * @returns {Promise<object>} A promise that resolves to the API response.
 */
export const deleteAnnualRecord = (projectId, campaignId, type, category) => {
	if (isTrialMode()) {
		const records = JSON.parse(localStorage.getItem(TRIAL_RECORDS_KEY) || '[]');
		const index = records.findIndex(r => r.project_id == projectId && r.campaign_id == campaignId && r.type === type && r.category === category);
		if (index !== -1) {
			records.splice(index, 1);
			localStorage.setItem(TRIAL_RECORDS_KEY, JSON.stringify(records));
		}
		return Promise.resolve({ success: true });
	}
	return apiRequest(`${BASE_ENDPOINT}/${projectId}/${campaignId}/${type}/${encodeURIComponent(category)}`, {
		method: 'DELETE',
	});
};

/**
 * Saves a batch of annual records.
 *
 * @param {object} batchData - The batch data to save.
 * @param {number} batchData.project_id - The ID of the project.
 * @param {number} batchData.campaign_id - The ID of the campaign.
 * @param {string} batchData.date_occurred - The date when the records occurred.
 * @param {Array} batchData.records - Array of record objects.
 * @returns {Promise<object>} A promise that resolves to the API response.
 */
export const saveAnnualRecordsBatch = (batchData) => {
	if (isTrialMode()) {
		const records = JSON.parse(localStorage.getItem(TRIAL_RECORDS_KEY) || '[]');
		const newRecords = batchData.records.map(r => ({
			...r,
			project_id: batchData.project_id,
			campaign_id: batchData.campaign_id,
			date_occurred: batchData.date_occurred,
			id: Date.now() + Math.random(), // Dummy ID
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}));
		records.push(...newRecords);
		localStorage.setItem(TRIAL_RECORDS_KEY, JSON.stringify(records));
		return Promise.resolve({ success: true, records: newRecords });
	}
	return apiRequest(`${BASE_ENDPOINT}/batch`, {
		method: 'POST',
		body: JSON.stringify(batchData),
	});
};
