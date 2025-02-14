import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Header from '../components/Header'
import { BlogPost as BlogPostType } from '../types/blog'
import { getPostBySlug } from '../utils/blog'

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<BlogPostType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) {
        navigate('/blog')
        return
      }

      try {
        const postData = await getPostBySlug(slug)
        if (!postData) {
          navigate('/blog')
          return
        }
        setPost(postData)
      } catch (error) {
        console.error('Error loading blog post:', error)
        navigate('/blog')
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [slug, navigate])

  if (loading || !post) {
    return (
      <div className="min-h-screen w-full bg-[#0F0F0F] flex flex-col items-center overflow-x-hidden">
        <Header />
        <div className="flex-grow pt-32 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#0F0F0F] overflow-x-hidden">
      <Header />
      <div className="flex justify-center pt-32 pb-6 sm:pb-8">
        <div className="w-full max-w-[1400px] px-2 sm:px-4 lg:px-8">
          <div className="flex justify-center">
            <div className="w-full max-w-[1000px]">
              {/* Blog Post Card */}
              <div className="bg-[#141414] rounded-lg sm:rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.6)]">
                {/* Header */}
                <div className="p-4 sm:p-6 lg:p-8 border-b border-white/10">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6 text-xs sm:text-sm text-gray-400">
                    <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-indigo-500" />
                    <span>{post.frontMatter.date}</span>
                    <div className="w-1 h-1 rounded-full bg-gray-700" />
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {post.frontMatter.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-1.5 sm:px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] sm:text-xs rounded-full border border-indigo-500/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 font-manrope leading-tight">
                    {post.frontMatter.title}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                    {post.frontMatter.description}
                  </p>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 lg:p-8">
                  <article className="prose prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code: ({ className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '')
                          const isInline = !match
                          
                          if (isInline) {
                            return (
                              <code className="bg-[#1a1a1a] rounded px-1 sm:px-1.5 py-0.5 text-sm sm:text-base" {...props}>
                                {children}
                              </code>
                            )
                          }

                          return (
                            <div className="relative group">
                              <div className="absolute -top-3 right-4 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs text-gray-400 bg-[#1a1a1a] rounded-t-lg">
                                {match?.[1] || 'code'}
                              </div>
                              <pre className="!bg-[#1a1a1a] !p-3 sm:!p-4 !pt-5 sm:!pt-6 rounded-lg text-sm sm:text-base">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            </div>
                          )
                        },
                        h1: ({ children }) => (
                          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-manrope mt-6 sm:mt-8 first:mt-0">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-manrope mt-6 sm:mt-8">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base sm:text-lg md:text-xl font-bold font-manrope mt-4 sm:mt-6">{children}</h3>
                        ),
                        a: ({ children, href }) => (
                          <a 
                            href={href}
                            className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm sm:text-base"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 sm:border-l-4 border-indigo-500/30 pl-3 sm:pl-4 italic text-sm sm:text-base">
                            {children}
                          </blockquote>
                        ),
                        p: ({ children }) => (
                          <p className="text-sm sm:text-base leading-relaxed">{children}</p>
                        ),
                      }}
                    >
                      {post.content}
                    </ReactMarkdown>
                  </article>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 sm:mt-8 bg-[#141414] rounded-lg sm:rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.6)]">
                <div className="p-4 sm:p-6 flex items-center justify-center gap-4 sm:gap-6">
                  <a 
                    href="https://www.linkedin.com/in/umut-yananer/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://github.com/umutdinceryananer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.239 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://stackoverflow.com/users/14721871/umut"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.986 21.865v-6.404h2.134V24H1.844v-8.539h2.13v6.404h15.012zM6.111 19.731H16.85v-2.137H6.111v2.137zm.259-4.852l10.48 2.189.451-2.07-10.478-2.187-.453 2.068zm1.359-5.056l9.705 4.53.903-1.95-9.706-4.53-.902 1.95zm2.715-4.785l8.217 6.855 1.359-1.62-8.216-6.853-1.36 1.618zM15.751 0l-1.746 1.294 6.405 8.604 1.746-1.294L15.749 0z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlogPost 