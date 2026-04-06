"use client";

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

import { ArrowLeft, Edit2, MessageCircle } from 'lucide-react'
import { collection, getDocs, query, where } from 'firebase/firestore'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { db } from '@/lib/config/firebase'
import { formatRelativeDate
, renderContent, getMainBlogImage, getBlogImages } from '@/lib/utils/blogHelpers';

import { useAuth } from '@/context/useAuth'

export default function AuthorPostsPage() {
    const router = useRouter()
    const { authorId } = useParams()

    const [posts, setPosts] = useState([])
    const [authorName, setAuthorName] = useState('')
    const [comments, setComments] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const { profile } = useAuth();

    useEffect(() => { fetchAuthorPosts() }, [authorId])

    const fetchAuthorPosts = async () => {
        setIsLoading(true)
        try {
            // Fetch all posts by this author
            const q = query(collection(db, 'blog_posts'), where('authorUid', '==', authorId))
            const postsSnap = await getDocs(q)

            const postsData = postsSnap.docs
                .map((d) => {
                    const data = d.data()
                    return {
                        id: d.id,
                        ...data,
                        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
                        updatedAt: data.updatedAt?.toDate?.() || (data.updatedAt ? new Date(data.updatedAt) : null),
                    }
                })
                .sort((a, b) => b.createdAt - a.createdAt)

            setPosts(postsData)

            // Grab author name from the first post
            if (postsData.length > 0) setAuthorName(postsData[0].author)

            // Fetch comment counts for each post
            const commentsSnap = await getDocs(collection(db, 'blog_comments'))
            const commentsMap = {}
            commentsSnap.docs.forEach((d) => {
                commentsMap[d.id] = (d.data().comments || []).length
            })
            setComments(commentsMap)
        } catch (error) {
            console.error('Error fetching author posts:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <Button variant="outline" onClick={() => router.push('/zone')} className="flex items-center gap-2 shrink-0">
                        <ArrowLeft className="w-4 h-4" />
                        All Posts
                    </Button>

                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Posts by</p>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            👤 {authorName || 'Author'}
                        </h1>
                    </div>
                </div>

                {/* Post count badge */}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {posts.length} {posts.length === 1 ? 'post' : 'posts'} published
                </p>

                {/* Posts list */}
                {posts.length === 0 ? (
                    <Card className="p-12 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            This author hasn't published any posts yet.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {posts.map((post) => {
                            const mainImage = getMainBlogImage(post)
                            const imageCount = getBlogImages(post).length

                            return (
                                <div
                                    key={post.id}
                                    className="overflow-hidden md:h-60 hover:shadow-lg transition-shadow cursor-pointer rounded-lg bg-gray-800 h-full"
                                    onClick={() => router.push(`/zone/${post.id}/view`)}
                                >
                                    <div className="flex h-full flex-col md:flex-row">
                                        {mainImage && (
                                            <div className="h-60 md:h-auto md:w-1/3 shrink-0">
                                                <img
                                                    src={mainImage}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover md:object-fill object-center"
                                                />
                                            </div>
                                        )}

                                        <div className={`p-3 md:p-6 flex flex-col justify-between gap-3 ${mainImage ? 'md:w-2/3' : 'w-full'}`}>
                                            <div className="space-y-4">
                                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2">
                                                    {post.title}
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <span>✍️ {post.author}</span>
                                                    <span className='text-right'>📅 {formatRelativeDate(post.createdAt)}</span>
                                                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-3xl w-fit text-xs font-medium">
                                                        {post.category}
                                                    </span>
                                                </div>
                                                <div
                                                    className="text-gray-600 flex flex-1 dark:text-gray-400 text-sm line-clamp-2"
                                                    dangerouslySetInnerHTML={{
                                                        __html:
                                                            renderContent((post.content || '').substring(0, 160)) +
                                                            ((post.content || '').length > 160 ? '...' : ''),
                                                    }}
                                                />
                                                {imageCount > 1 && (
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">{imageCount} photos</p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm">
                                                    <MessageCircle className="w-4 h-4" />
                                                    <span>{comments[post.id] || 0} comments</span>
                                                </div>

                                                {post.authorUid === profile?.uid && (
                                                    <Button
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            router.push(`/zone/${post.id}/edit`)
                                                        }}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Edit2 className="w-3 h-3" />
                                                        Edit
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}