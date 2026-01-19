/**
 * @file Service functions for interacting with the campaigns API.
 */

import { apiRequest } from './api';

const BASE_ENDPOINT = 'ccp/v1/campaigns';
const TRIAL_CAMPAIGNS_KEY = 'trialCampaigns';

/**
 * Checks if the user is in trial mode.
 *
 * @returns {boolean} True if in trial mode.
 */
const isTrialMode = () => {
	return localStorage.getItem('isTrialMode') === 'true';
};

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
	if (isTrialMode()) {
		const campaigns = JSON.parse(localStorage.getItem(TRIAL_CAMPAIGNS_KEY) || '[]');
		const filtered = campaigns.filter(c => c.project_id == projectId);
		return Promise.resolve(filtered);
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
	if (isTrialMode()) {
		const campaigns = JSON.parse(localStorage.getItem(TRIAL_CAMPAIGNS_KEY) || '[]');
		const newCampaign = {
			...campaignData,
			id: Date.now(), // Dummy ID
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};
		campaigns.push(newCampaign);
		localStorage.setItem(TRIAL_CAMPAIGNS_KEY, JSON.stringify(campaigns));
		return Promise.resolve(newCampaign);
	}
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
 * @param {string} [campaignData.montes_contribuyentes] - JSON string of contributing montes IDs.
 * @param {string} [campaignData.montes_production] - JSON string of production per monte.
 * @returns {Promise<object>} A promise that resolves to the updated campaign object.
 */
export const updateCampaign = (campaignId, campaignData) => {
	if (!campaignId) {
		return Promise.reject(new Error('Campaign ID is required.'));
	}
	if (isTrialMode()) {
		const campaigns = JSON.parse(localStorage.getItem(TRIAL_CAMPAIGNS_KEY) || '[]');
		const index = campaigns.findIndex(c => c.id == campaignId);
		if (index === -1) {
			return Promise.reject(new Error('Campaign not found.'));
		}
		campaigns[index] = { ...campaigns[index], ...campaignData, updated_at: new Date().toISOString() };
		localStorage.setItem(TRIAL_CAMPAIGNS_KEY, JSON.stringify(campaigns));
		return Promise.resolve(campaigns[index]);
	}
	return apiRequest(`${BASE_ENDPOINT}/${campaignId}`, {
		method: 'PUT',
		body: JSON.stringify(campaignData),
	});
};

/**
 * Closes the currently active campaign for a project.
 *
 * @param {object} data - The data for closing the active campaign.
 * @param {number} data.project_id - The ID of the project.
 * @returns {Promise<object>} A promise that resolves to the response.
 */
export const closeActiveCampaign = (data) => {
	return apiRequest(`${BASE_ENDPOINT}/close-active`, {
		method: 'POST',
		body: JSON.stringify(data),
	});
};