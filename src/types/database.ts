export interface QuizResponse {
  id: number;
  name: string;
  email: string;
  contact: string;
  age: number;
  created_at?: string;
  updated_at?: string;
}

export interface QuizAnswer {
  id: number;
  response_id: number;
  question_id: number;
  answer_text: string;
  additional_info?: string;
  file_url?: string;
  created_at?: string;
}

export interface Question {
  id: number;
  question_text: string;
  question_type: 'text' | 'select' | 'number' | 'email' | 'tel';
  placeholder?: string;
  description?: string;
  has_text_area: boolean;
  has_file_upload: boolean;
  text_area_placeholder?: string;
  accepted_file_types?: string;
  validation_rules?: string;
  order_index: number;
  status: 'draft' | 'active';
  created_at?: string;
  updated_at?: string;
}

export interface QuestionOption {
  id: number;
  question_id: number;
  option_text: string;
  order_index: number;
  created_at?: string;
}

export interface Tag {
  id: number;
  name: string;
  icon_url?: string;
  title?: string;
  created_at?: string;
}

export interface OptionTag {
  id: number;
  option_id: number;
  tag_id: number;
  created_at?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string; // HTML/rich text content
  image_url?: string;
  url?: string;
  mrp?: number;
  srp?: number;
  is_active: boolean;
  shopify_variant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AnswerKey {
  id: number;
  tag_combination: string;
  recommended_products: string;
  coupon_code?: string;
  discount_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: number;
  name: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizReport {
  totalResponses: number;
  ageDistribution: {
    '18-25': number;
    '26-35': number;
    '36-45': number;
    '46+': number;
  };
  questionStats: {
    [key: string]: {
      [answer: string]: number;
    };
  };
}