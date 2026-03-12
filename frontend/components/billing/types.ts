export interface BillingPlan {
  name?: string;
  slug?: string;
  included_users?: number;
  features?: string[];
  [key: string]: unknown;
}

export interface BillingAddon {
  name?: string;
  type?: string;
  [key: string]: unknown;
}

export interface BillingStatus {
  subscribed?: boolean;
  on_trial?: boolean;
  plan?: BillingPlan;
  trial_ends_at?: string;
  current_users_count?: number;
  max_users?: number;
  extra_users_quantity?: number;
  addons?: string[];
  [key: string]: unknown;
}

export interface PlansData {
  plans: Record<string, BillingPlan>;
  addons: Record<string, BillingAddon>;
}
