import matter from 'gray-matter';
import { BlogPost } from '../types/blog';
import { Buffer } from 'buffer';

// Ensure Buffer is available globally
globalThis.Buffer = Buffer;

// Function to get all blog posts
export async function getAllPosts(): Promise<BlogPost[]> {
  const modules = import.meta.glob('../../blog/*.md', { as: 'raw', eager: true });
  
  return Object.entries(modules).map(([path, content]) => {
    const slug = path.split('/').pop()?.replace('.md', '') || '';
    const { data: frontMatter, content: markdownContent } = matter(content as string);
    
    return {
      slug,
      frontMatter: {
        title: frontMatter.title,
        date: frontMatter.date,
        description: frontMatter.description,
        tags: frontMatter.tags,
        coverGradient: frontMatter.coverGradient,
      },
      content: markdownContent,
    };
  }).sort((a, b) => new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime());
}

// Function to get a single blog post by slug
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllPosts();
  return posts.find(post => post.slug === slug) || null;
} 