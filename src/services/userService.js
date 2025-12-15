import { apiRequest } from './api';

/**
 * Fetch current user data from WordPress REST API
 * @returns {Promise<Object>} User data object
 */
export const getCurrentUser = async () => {
  try {
    const user = await apiRequest('ccp/v1/users/me');
    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};