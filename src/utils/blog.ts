import matter from 'gray-matter';
import { BlogPost } from '../types/blog';
import { Buffer } from 'buffer';

// Ensure Buffer is available globally
globalThis.Buffer = Buffer;

// Function to get all blog posts
export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    console.log('Starting getAllPosts function...');
    const modules = import.meta.glob('/public/blog/*.md', { as: 'raw', eager: true });
    console.log('Loaded modules:', modules);
    
    if (!modules || Object.keys(modules).length === 0) {
      console.log('No blog posts found');
      return [];
    }
    
    const posts = Object.entries(modules).map(([path, content]) => {
      console.log('Processing file:', path);
      const slug = path.split('/').pop()?.replace('.md', '') || '';
      const { data: frontMatter, content: markdownContent } = matter(content as string);
      
      return {
        slug,
        frontMatter: {
          title: frontMatter.title || '',
          date: frontMatter.date || new Date().toISOString(),
          description: frontMatter.description || '',
          tags: frontMatter.tags || [],
          coverGradient: frontMatter.coverGradient || '',
        },
        content: markdownContent,
      };
    }).sort((a, b) => new Date(b.frontMatter.date).getTime() - new Date(a.frontMatter.date).getTime());

    console.log('Processed posts:', posts);
    return posts;
  } catch (error) {
    console.error('Error in getAllPosts:', error);
    return [];
  }
}

// Function to get a single blog post by slug
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllPosts();
  return posts.find(post => post.slug === slug) || null;
} 