export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  actions?: ChatAction[];
  dataCards?: ChatDataCard[];
  links?: ChatLink[];
  isLoading?: boolean;
}

export interface ChatAction {
  id: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  requiresConfirmation: boolean;
}

export interface ChatDataCard {
  title: string;
  type: 'kpi' | 'table' | 'list';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
}

export interface ChatLink {
  label: string;
  route: string;
  icon?: string;
}

