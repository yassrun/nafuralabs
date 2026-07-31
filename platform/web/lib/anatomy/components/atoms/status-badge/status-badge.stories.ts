import type { Meta, StoryObj } from '@storybook/angular';

import { StatusBadgeComponent } from './status-badge.component';

const meta: Meta<StatusBadgeComponent> = {
  title: 'Anatomy/Atoms/Status Badge',
  component: StatusBadgeComponent,
  tags: ['autodocs'],
  args: {
    entityType: 'ORDER',
    status: 'DRAFT',
  },
  argTypes: {
    entityType: {
      control: 'select',
      options: ['ORDER', 'SITE', 'CONTRACT', 'INVOICE', 'APPROVAL'],
    },
    status: {
      control: 'text',
    },
  },
};

export default meta;

type Story = StoryObj<StatusBadgeComponent>;

export const Draft: Story = {
  args: {
    entityType: 'ORDER',
    status: 'DRAFT',
  },
};

export const Approved: Story = {
  args: {
    entityType: 'ORDER',
    status: 'APPROVED',
  },
};

export const ActiveSite: Story = {
  args: {
    entityType: 'SITE',
    status: 'IN_PROGRESS',
  },
};
