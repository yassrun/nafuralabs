import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../app/**/*.stories.@(ts|mdx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  staticDirs: ['../public'],
};

export default config;