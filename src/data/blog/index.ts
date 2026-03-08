import type { SwymbleBlogState } from '../types';
import { SWYMBLE_BLOG_META } from './meta';
import { SWYMBLE_BLOG_POSTS } from './posts';

export const SWYMBLE_BLOG: SwymbleBlogState = {
  ...SWYMBLE_BLOG_META,
  posts: SWYMBLE_BLOG_POSTS,
};
