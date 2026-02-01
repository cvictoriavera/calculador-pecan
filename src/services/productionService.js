/**
 * @file Service functions for interacting with the productions API.
 */

import { apiRequest } from './api';

const BASE_ENDPOINT = 'ccp/v1/productions';

/**
 * Checks if the user is in trial mode.
 *
 * @returns {boolean} True if in trial mode.
 */
const isTrialMode = () => {
	return localStorage.getItem('isTrialMode') === 'true';
};

/**
 * Fetches all productions for a given campaign.
 *
 * @param {number} campaignId - The ID of the campaign.
 * @returns {Promise<Array>} A promise that resolves to an array of production objects.
 */
export const getProductionsByCampaign = (campaignId) => {
  if (!campaignId) {
    return Promise.reject(new Error('Campaign ID is required.'));
  }
  if (isTrialMode()) {
    // For trial mode, load from localStorage
    const stored = localStorage.getItem(`productions_campaign_${campaignId}`);
    return Promise.resolve(stored ? JSON.parse(stored) : []);
  }
  return apiRequest(`${BASE_ENDPOINT}/by-campaign/${campaignId}`);
};

/**
 * Creates or updates productions for a campaign.
 *
 * @param {number} campaignId - The ID of the campaign.
 * @param {object} productionData - The data for the productions.
 * @param {number} productionData.project_id - The ID of the project.
 * @param {Array} productionData.productions - Array of production records.
 * @param {string} productionData.input_type - The input type ('total' or 'detail').
 * @returns {Promise<object>} A promise that resolves to the response.
 */
export const createProductionsByCampaign = (campaignId, productionData) => {
  if (!campaignId) {
    return Promise.reject(new Error('Campaign ID is required.'));
  }
  if (isTrialMode()) {
    // For trial mode, save to localStorage and return fake result
    const productionsWithType = (productionData.productions || []).map(p => ({ ...p, input_type: productionData.input_type }));
    localStorage.setItem(`productions_campaign_${campaignId}`, JSON.stringify(productionsWithType));
    return Promise.resolve({
      success: true,
      campaign_id: campaignId,
      productions: productionsWithType,
    });
  }
  return apiRequest(`${BASE_ENDPOINT}/by-campaign/${campaignId}`, {
    method: 'POST',
    body: JSON.stringify(productionData),
  });
};

/**
 * Deletes all productions for a campaign.
 *
 * @param {number} campaignId - The ID of the campaign.
 * @returns {Promise<object>} A promise that resolves to the response.
 */
export const deleteProductionsByCampaign = (campaignId) => {
  if (!campaignId) {
    return Promise.reject(new Error('Campaign ID is required.'));
  }
  if (isTrialMode()) {
    // For trial mode, return fake result without API call
    return Promise.resolve({ deleted: true });
  }
  return apiRequest(`${BASE_ENDPOINT}/by-campaign/${campaignId}`, {
    method: 'DELETE',
  });
};

/**
 * Fetches productions for multiple campaigns in batch.
 *
 * @param {Array<number>} campaignIds - Array of campaign IDs.
 * @returns {Promise<object>} A promise that resolves to an object with campaign IDs as keys and production arrays as values.
 */
export const getProductionsBatch = (campaignIds) => {
  if (!Array.isArray(campaignIds) || campaignIds.length === 0) {
    return Promise.reject(new Error('Campaign IDs array is required and cannot be empty.'));
  }
  if (isTrialMode()) {
    // For trial mode, return fake batch result
    const fakeResult = {};
    campaignIds.forEach(id => {
      fakeResult[id] = [];
    });
    return Promise.resolve(fakeResult);
  }

  return apiRequest(`${BASE_ENDPOINT}/by-campaigns/batch`, {
    method: 'POST',
    body: JSON.stringify({ campaign_ids: campaignIds }),
  });
};