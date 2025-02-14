export interface BlogPost {
  slug: string;
  frontMatter: {
    title: string;
    date: string;
    description: string;
    tags: string[];
    coverGradient: string;
  };
  content: string;
}