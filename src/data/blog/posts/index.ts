import type { SwymbleBlogPost } from '../../types';

type BlogPostModule = {
	default: SwymbleBlogPost;
};

const blogPostModules = import.meta.glob<BlogPostModule>('./*.ts', {
	eager: true,
});

export const SWYMBLE_BLOG_POSTS: SwymbleBlogPost[] = Object.entries(blogPostModules)
	.filter(([path]) => !path.endsWith('/index.ts'))
	.map(([, module]) => module.default)
	.filter(Boolean)
	.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
