/**
 * @file Service functions for interacting with the productions API.
 */

import { apiRequest } from './api';

const BASE_ENDPOINT = 'ccp/v1/productions';

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
  return apiRequest(`${BASE_ENDPOINT}/by-campaign/${campaignId}`, {
    method: 'DELETE',
  });
};