/**
 * Centralized Application Configuration
 * Reads Vite environment variables with fallback defaults.
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DEFAULT_USER_ID =
  import.meta.env.VITE_DEFAULT_USER_ID || 'default_user';

export const appConfig = {
  apiBaseUrl: API_BASE_URL,
  defaultUserId: DEFAULT_USER_ID,
  endpoints: {
    chatStream: `${API_BASE_URL}/chat/stream`,
    userThreads: (userId: string = DEFAULT_USER_ID) =>
      `${API_BASE_URL}/users/${userId}/threads`,
    threadMessages: (threadId: string) =>
      `${API_BASE_URL}/threads/${threadId}/messages`,
    deleteThread: (threadId: string) =>
      `${API_BASE_URL}/threads/${threadId}`,
  },
};

export default appConfig;
