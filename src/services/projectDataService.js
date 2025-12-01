/**
 * @file Service functions for interacting with the annual records API.
 */

import { apiRequest } from './api';

const BASE_ENDPOINT = 'ccp/v1/annual-records';

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
	return apiRequest(`${BASE_ENDPOINT}/batch`, {
		method: 'POST',
		body: JSON.stringify(batchData),
	});
};
