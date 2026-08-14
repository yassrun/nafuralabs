import type { Meta, StoryObj } from '@storybook/angular';
import { StatusBadgeComponent } from './status-badge.component';

const meta: Meta<StatusBadgeComponent> = {
  title: 'Anatomy/Atoms/StatusBadge',
  component: StatusBadgeComponent,
  tags: ['autodocs'],
  argTypes: {
    entityType: {
      control: 'select',
      options: ['APPROBATION'],
    },
    status: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<StatusBadgeComponent>;

export const PendingApproval: Story = {
  args: {
    entityType: 'APPROBATION',
    status: 'EN_ATTENTE',
  },
};

export const Approved: Story = {
  args: {
    entityType: 'APPROBATION',
    status: 'APPROUVE',
  },
};
