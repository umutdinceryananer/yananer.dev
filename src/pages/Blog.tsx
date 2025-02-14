import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { BlogPost } from '../types/blog'
import { getAllPosts } from '../utils/blog'

const Blog = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPosts = async () => {
      try {
        console.log('Loading blog posts...')
        const posts = await getAllPosts()
        console.log('Loaded posts:', posts)
        setBlogPosts(posts || [])
      } catch (error) {
        console.error('Error loading blog posts:', error)
        setError(error instanceof Error ? error.message : 'Failed to load blog posts')
        setBlogPosts([])
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0F0F0F] flex flex-col items-center overflow-x-hidden">
        <Header />
        <div className="flex-grow pt-32 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-[#0F0F0F] flex flex-col items-center overflow-x-hidden">
        <Header />
        <div className="flex-grow pt-32 flex items-center justify-center">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#0F0F0F] flex flex-col items-center overflow-x-hidden">
      <Header />
      <div className="w-full max-w-[1400px] px-2 sm:px-4 lg:px-8 pt-32 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {!blogPosts || blogPosts.length === 0 ? (
            <div className="col-span-full text-white text-center">No blog posts found</div>
          ) : (
            <>
              {blogPosts.map((post) => (
                <Link 
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="bg-[#141414] rounded-lg sm:rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(0,0,0,0.7)] transition-all group"
                >
                  <div className="p-3 sm:p-4 lg:p-6 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1.5 sm:mb-2 md:mb-4">
                      <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-indigo-500" />
                      <span className="text-[10px] sm:text-xs md:text-sm text-gray-400">{post.frontMatter.date}</span>
                    </div>

                    {/* Title */}
                    <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white mb-1.5 sm:mb-2 md:mb-3 font-manrope group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {post.frontMatter.title}
                    </h2>

                    {/* Description */}
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-400 mb-1.5 sm:mb-2 md:mb-4 line-clamp-3 flex-grow">
                      {post.frontMatter.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 mt-auto">
                      {post.frontMatter.tags?.map((tag, tagIndex) => (
                        <span 
                          key={tagIndex}
                          className="px-1 sm:px-1.5 md:px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] sm:text-[10px] md:text-xs rounded-full border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}

              {/* Placeholder cards */}
              {[...Array(Math.max(0, 9 - (blogPosts?.length || 0)))].map((_, index) => (
                <div 
                  key={`placeholder-${index}`}
                  className="bg-[#141414] rounded-lg sm:rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.6)] opacity-50"
                >
                  <div className="p-3 sm:p-4 lg:p-6 flex items-center justify-center h-full min-h-[160px] sm:min-h-[180px] lg:min-h-[200px]">
                    <span className="text-gray-600 font-manrope text-xs sm:text-sm">Coming Soon</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Blog 