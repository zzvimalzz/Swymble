import type { SwymbleBlogState } from '../types';

export const SWYMBLE_BLOG_META: Pick<
  SwymbleBlogState,
  'title' | 'description' | 'emptyStateMsg' | 'categories'
> = {
  title: 'BLOG',
  description: 'Read through my thoughts',
  emptyStateMsg: 'No posts yet. Check back soon for random thoughts and deep dives into my projects and learnings.',
  categories: [
    {
      id: 'cortex',
      label: 'CORTEX',
      description: 'Long-context memory and cognitive UX experiments.',
    },
  ],
};
