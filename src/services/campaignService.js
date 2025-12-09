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

/**
 * Creates a new campaign.
 *
 * @param {object} campaignData - The data for the new campaign.
 * @param {number} campaignData.project_id - The ID of the project.
 * @param {string} campaignData.campaign_name - The name of the campaign.
 * @param {number} campaignData.year - The year of the campaign.
 * @param {string} campaignData.start_date - The start date of the campaign.
 * @param {string} [campaignData.end_date] - The end date of the campaign.
 * @param {string} [campaignData.status] - The status of the campaign.
 * @param {number} [campaignData.is_current] - Whether this is the current campaign.
 * @param {string} [campaignData.notes] - Notes for the campaign.
 * @returns {Promise<object>} A promise that resolves to the created campaign object.
 */
export const createCampaign = (campaignData) => {
	return apiRequest(BASE_ENDPOINT, {
		method: 'POST',
		body: JSON.stringify(campaignData),
	});
};

/**
 * Updates an existing campaign.
 *
 * @param {number} campaignId - The ID of the campaign to update.
 * @param {object} campaignData - The data to update.
 * @param {string} [campaignData.campaign_name] - The name of the campaign.
 * @param {number} [campaignData.year] - The year of the campaign.
 * @param {string} [campaignData.start_date] - The start date of the campaign.
 * @param {string} [campaignData.end_date] - The end date of the campaign.
 * @param {string} [campaignData.status] - The status of the campaign.
 * @param {number} [campaignData.is_current] - Whether this is the current campaign.
 * @param {string} [campaignData.notes] - Notes for the campaign.
 * @param {number} [campaignData.average_price] - Average price for production.
 * @param {number} [campaignData.total_production] - Total production.
 * @returns {Promise<object>} A promise that resolves to the updated campaign object.
 */
export const updateCampaign = (campaignId, campaignData) => {
	if (!campaignId) {
		return Promise.reject(new Error('Campaign ID is required.'));
	}
	return apiRequest(`${BASE_ENDPOINT}/${campaignId}`, {
		method: 'PUT',
		body: JSON.stringify(campaignData),
	});
};
