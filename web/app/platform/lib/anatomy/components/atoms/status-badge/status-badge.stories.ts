import type { Meta, StoryObj } from '@storybook/angular';

import { StatusBadgeComponent } from './status-badge.component';

const meta: Meta<StatusBadgeComponent> = {
  title: 'Anatomy/Atoms/Status Badge',
  component: StatusBadgeComponent,
  tags: ['autodocs'],
  args: {
    entityType: 'BC',
    status: 'BROUILLON',
  },
  argTypes: {
    entityType: {
      control: 'select',
      options: ['BC', 'CHANTIER', 'MARCHE', 'FACTURE', 'APPROBATION'],
    },
    status: {
      control: 'text',
    },
  },
};

export default meta;

type Story = StoryObj<StatusBadgeComponent>;

export const PurchaseDraft: Story = {
  args: {
    entityType: 'BC',
    status: 'BROUILLON',
  },
};

export const PurchaseApproved: Story = {
  args: {
    entityType: 'BC',
    status: 'APPROUVE',
  },
};

export const ActiveChantier: Story = {
  args: {
    entityType: 'CHANTIER',
    status: 'EN_COURS',
  },
};