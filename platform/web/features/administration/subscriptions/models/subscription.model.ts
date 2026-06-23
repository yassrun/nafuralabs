export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  pricePerMonth: number | null;
  currency: string | null;
  isCurrent: boolean;
}

export interface SubscriptionUsageMetric {
  key: string;
  label: string;
  used: number;
  limit: number | null;
}

export interface SubscriptionOverview {
  currentPlan: SubscriptionPlan | null;
  availablePlans: SubscriptionPlan[];
  metrics: SubscriptionUsageMetric[];
}
