export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  avatar_url?: string | null;
  is_2fa_enabled?: boolean;
  github_url?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  website_url?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TOTPSetupResponse {
  secret: string;
  qr_code: string;
  otpauth_url: string;
}

export interface AuthResponse {
  access_token?: string;
  token_type?: string;
  user?: User;
  requires_2fa?: boolean;
  temp_token?: string;
  message?: string;
}

export interface KeywordContribution {
  word: string;
  score: number;
  is_suspicious: boolean;
  reason?: string;
}

export interface ReviewFeatures {
  char_count: number;
  word_count: number;
  avg_word_length: number;
  exclamation_count: number;
  exclamation_ratio: number;
  uppercase_ratio: number;
  lexical_diversity: number;
  suspicious_patterns_score: number;
  sentiment?: {
    compound: number;
    pos: number;
    neu: number;
    neg: number;
    label: string;
  };
}

export interface ReviewerActivity {
  reviewer_id?: string | null;
  has_data: boolean;
  posting_frequency: string;
  total_reviews: number;
  burst_detected: boolean;
  burst_count: number;
  min_delta_hours?: number | null;
  rating_mean?: number | null;
  rating_std?: number;
  extreme_rating_ratio?: number;
  pattern_label: string;
  reviewer_risk_score: number;
  risk_flags: string[];
}

export interface ReviewAnalysisResult {
  id?: number;
  review_text: string;
  rating?: number | null;
  reviewer_id?: string | null;
  reviewer_activity?: ReviewerActivity | null;
  prediction: 'genuine' | 'suspicious' | 'likely_fake';
  confidence: number;
  fake_probability: number;
  sentiment_label: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
  is_duplicate: boolean;
  duplicate_similarity: number;
  matched_review_id?: number | null;
  suspicious_keywords: KeywordContribution[];
  features: ReviewFeatures;
  source: string;
  created_at: string;
}

export interface BulkJobStatus {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed_rows: number;
  fake_count: number;
  suspicious_count: number;
  genuine_count: number;
  duplicate_count: number;
  error_message?: string | null;
  results_preview?: BulkAnalyzeItem[] | null;
  created_at: string;
}

export interface BulkAnalyzeItem {
  id?: number;
  review_text: string;
  rating?: number | null;
  reviewer_id?: string | null;
  reviewer_activity?: ReviewerActivity | null;
  prediction: string;
  confidence: number;
  fake_probability: number;
  sentiment_label: string;
  sentiment_score: number;
  is_duplicate: boolean;
  duplicate_similarity: number;
  top_suspicious_words: string[];
}

export interface Dataset {
  id: number;
  name: string;
  filename: string;
  row_count: number;
  label_balance?: Record<string, number>;
  description?: string;
  uploaded_by?: number;
  created_at: string;
}

export interface DatasetPreview {
  dataset: Dataset;
  columns: string[];
  preview_rows: Record<string, any>[];
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface ModelRecord {
  id: number;
  model_name: string;
  model_type: string;
  status?: 'training' | 'completed' | 'failed' | string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix?: ConfusionMatrix;
  is_active: boolean;
  parameters?: Record<string, any>;
  dataset_name?: string;
  created_at: string;
  baseline_f1?: number;
  f1_difference?: number;
  is_calibrated?: boolean;
  latency_ms?: number;
}

export interface AnalyticsSummary {
  total_reviews_analyzed: number;
  genuine_count: number;
  fake_count: number;
  duplicate_count: number;
  average_confidence: number;
  sentiment_breakdown: Array<{
    sentiment: string;
    genuine: number;
    fake: number;
  }>;
  status_distribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  timeline: Array<{
    date: string;
    genuine: number;
    fake: number;
  }>;
  top_suspicious_keywords: Array<{
    keyword: string;
    count: number;
    fake_ratio: number;
  }>;
}

export interface AssistantChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantChatResponse {
  reply: string;
  suggested_prompts: string[];
  provider: string;
}
