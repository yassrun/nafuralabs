import type { EmailTemplate } from '../../models';

export const ROUTES = {
  list: ['/administration/email-templates'],
  detail: (item: EmailTemplate) => ['/administration/email-templates', item.id],
  create: ['/administration/email-templates/new'],
};
