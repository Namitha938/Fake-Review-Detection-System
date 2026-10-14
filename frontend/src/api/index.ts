import { apiClient } from './client';
import {
  AuthResponse,
  ReviewAnalysisResult,
  BulkJobStatus,
  Dataset,
  DatasetPreview,
  ModelRecord,
  AnalyticsSummary,
  User,
  TOTPSetupResponse
} from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data;
  },
  googleAuth: async (email: string, full_name?: string, id_token?: string, target_role?: string): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/google', { email, full_name, id_token, target_role });
    return res.data;
  },
  register: async (email: string, full_name: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/register', { email, full_name, password });
    return res.data;
  },
  refresh: async (): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/refresh');
    return res.data;
  },
  getCurrentUser: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  updateProfile: async (data: {
    full_name: string;
    github_url?: string | null;
    linkedin_url?: string | null;
    twitter_url?: string | null;
    website_url?: string | null;
  }): Promise<User> => {
    const res = await apiClient.put('/auth/profile', data);
    return res.data;
  },
  changePassword: async (current_password: string, new_password: string, confirm_password: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/change-password', {
      current_password,
      new_password,
      confirm_password,
    });
    return res.data;
  },
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },
  verifyOtp: async (email: string, otp: string): Promise<{ message: string; reset_token: string }> => {
    const res = await apiClient.post('/auth/verify-otp', { email, otp });
    return res.data;
  },
  resetPassword: async (email: string, reset_token: string, new_password: string, confirm_password: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/reset-password', {
      email,
      reset_token,
      new_password,
      confirm_password,
    });
    return res.data;
  },
  setup2FA: async (): Promise<TOTPSetupResponse> => {
    const res = await apiClient.post('/auth/2fa/setup');
    return res.data;
  },
  confirm2FA: async (code: string): Promise<User> => {
    const res = await apiClient.post('/auth/2fa/confirm', { code });
    return res.data;
  },
  disable2FA: async (params?: { code?: string; password?: string }): Promise<User> => {
    const res = await apiClient.post('/auth/2fa/disable', params || {});
    return res.data;
  },
  verify2FA: async (temp_token: string, otp: string): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/verify-2fa', { temp_token, otp });
    return res.data;
  },
  resend2FA: async (temp_token: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/resend-2fa', { temp_token });
    return res.data;
  },
  toggle2FA: async (enable: boolean, password?: string): Promise<User> => {
    const res = await apiClient.post('/auth/toggle-2fa', { enable, password });
    return res.data;
  },
  updateAvatar: async (avatar_url: string): Promise<User> => {
    const res = await apiClient.put('/auth/avatar', { avatar_url });
    return res.data;
  },
};

export const reviewsApi = {
  analyzePublicSandbox: async (review_text: string, rating?: number | null, reviewer_id?: string | null): Promise<ReviewAnalysisResult> => {
    const res = await apiClient.post('/analyze/public', { review_text, rating, reviewer_id });
    return res.data;
  },
  analyzeSingle: async (review_text: string, rating?: number | null, reviewer_id?: string | null): Promise<ReviewAnalysisResult> => {
    const res = await apiClient.post('/analyze', { review_text, rating, reviewer_id });
    return res.data;
  },
  predictApi: async (review_text: string, rating?: number | null, reviewer_id?: string | null): Promise<ReviewAnalysisResult> => {
    const res = await apiClient.post('/predict', { review_text, rating, reviewer_id });
    return res.data;
  },
  getHistory: async (params?: { prediction?: string; sentiment?: string; search?: string; limit?: number; offset?: number }): Promise<ReviewAnalysisResult[]> => {
    const res = await apiClient.get('/history', { params });
    return res.data;
  },
  getHistoryDetail: async (id: number): Promise<ReviewAnalysisResult> => {
    const res = await apiClient.get(`/history/${id}`);
    return res.data;
  },
  deleteHistoryRecord: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/history/${id}`);
    return res.data;
  },
  verifyCertificate: async (id: string | number): Promise<{
    id: number;
    cert_id: string;
    verdict: string;
    confidence: number;
    fake_probability: number;
    sentiment_label?: string;
    created_at: string;
    is_valid: boolean;
    status: string;
  }> => {
    const res = await apiClient.get(`/verify/${id}`);
    return res.data;
  },
};

export const bulkApi = {
  uploadBulkCSV: async (file: File): Promise<BulkJobStatus> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getJobStatus: async (jobId: string): Promise<BulkJobStatus> => {
    const res = await apiClient.get(`/bulk/${jobId}/status`);
    return res.data;
  },
  getDownloadUrl: (jobId: string): string => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    return `${baseURL}/bulk/${jobId}/download`;
  },
  downloadResultsCSV: async (jobId: string): Promise<Blob> => {
    const res = await apiClient.get(`/bulk/${jobId}/download`, {
      responseType: 'blob',
    });
    return res.data;
  },
};

export const analyticsApi = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    const res = await apiClient.get('/analytics/summary');
    return res.data;
  },
};

export const datasetsApi = {
  getDatasets: async (): Promise<Dataset[]> => {
    const res = await apiClient.get('/datasets');
    return res.data;
  },
  uploadDataset: async (name: string, description: string, file: File): Promise<Dataset> => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('file', file);
    const res = await apiClient.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getPreview: async (id: number): Promise<DatasetPreview> => {
    const res = await apiClient.get(`/datasets/${id}/preview`);
    return res.data;
  },
  deleteDataset: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/datasets/${id}`);
    return res.data;
  },
};

export const modelsApi = {
  getModels: async (): Promise<ModelRecord[]> => {
    const res = await apiClient.get('/models/runs');
    return res.data;
  },
  trainModel: async (data: {
    model_type: string;
    dataset_name?: string;
    test_size?: number;
  }): Promise<ModelRecord> => {
    const res = await apiClient.post('/models/train', data);
    return res.data;
  },
  activateModel: async (id: number): Promise<ModelRecord> => {
    const res = await apiClient.post(`/models/${id}/activate`);
    return res.data;
  },
};

export const adminApi = {
  getUsers: async (): Promise<User[]> => {
    const res = await apiClient.get('/admin/users');
    return res.data;
  },
  updateUserRole: async (userId: number, role: string): Promise<User> => {
    const res = await apiClient.put(`/admin/users/${userId}/role?role=${role}`);
    return res.data;
  },
  getSystemStats: async (): Promise<Record<string, any>> => {
    const res = await apiClient.get('/admin/stats');
    return res.data;
  },
};

export const assistantApi = {
  chat: async (
    message: string,
    context?: any,
    history?: { role: string; content: string }[]
  ): Promise<{ reply: string; suggested_prompts: string[]; provider: string }> => {
    const res = await apiClient.post('/assistant/chat', {
      message,
      context,
      history,
    });
    return res.data;
  },
};
