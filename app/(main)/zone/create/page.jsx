"use client";

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { X, Bold, Italic, Link, ArrowLeft, Upload, Star } from 'lucide-react';
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea';

import { useAuth } from '@/context/useAuth'

import { categories } from '@/lib/constants'
import { useBlog } from '@/hooks/useBlog';

export default function CreatePostPage() {
    const router = useRouter()
    const { profile } = useAuth()
    const inputRef = useRef(null)
    const { createPost, loading } = useBlog();

    const [post, setPost] = useState({
        title: '',
        content: '',
        category: '',
        images: [],
        mainImageIndex: 0,
    })

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files || [])
        const validFiles = files.filter((file) => file.type.startsWith('image/'))

        if (validFiles.length === 0) {
            alert('Please select a valid image file')
            return
        }

        const newImages = validFiles.map((file) => ({
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            file,
            preview: URL.createObjectURL(file),
        }))

        setPost((prev) => {
            const nextImages = [...prev.images, ...newImages]
            return {
                ...prev,
                images: nextImages,
                mainImageIndex: nextImages.length === newImages.length ? 0 : prev.mainImageIndex,
            }
        })

        e.target.value = ''
    }

    const handleRemoveImage = (indexToRemove) => {
        setPost((prev) => {
            const removedImage = prev.images[indexToRemove]
            const nextImages = prev.images.filter((_, index) => index !== indexToRemove)
            const nextMainIndex = nextImages.length === 0
                ? 0
                : indexToRemove === prev.mainImageIndex
                    ? Math.min(indexToRemove, nextImages.length - 1)
                    : indexToRemove < prev.mainImageIndex
                        ? prev.mainImageIndex - 1
                        : prev.mainImageIndex

            if (removedImage?.preview?.startsWith('blob:')) {
                URL.revokeObjectURL(removedImage.preview)
            }

            return {
                ...prev,
                images: nextImages,
                mainImageIndex: nextMainIndex,
            }
        })
    }

    const handleSetMainImage = (index) => {
        setPost((prev) => ({
            ...prev,
            mainImageIndex: index,
        }))
    }

    const formatText = (tag) => {
        const textarea = document.getElementById('post-content')
        if (!textarea) return
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selected = textarea.value.substring(start, end)
        if (!selected) return alert('Please select some text first')

        let formatted = ''
        if (tag === 'bold') formatted = `**${selected}**`
        else if (tag === 'italic') formatted = `*${selected}*`
        else if (tag === 'link') {
            const url = prompt('Enter URL:')
            if (!url) return
            formatted = `[${selected}](${url})`
        }

        const newContent = post.content.substring(0, start) + formatted + post.content.substring(end)
        setPost({ ...post, content: newContent })
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start, start + formatted.length)
        }, 0)
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!post.title.trim() || !post.content.trim() || !post.category) {
            return alert("Please fill all required fields");
        }

        if (!profile?.uid) {
            return alert("You must be logged in");
        }

        const res = await createPost({ post, profile });

        if (res.success) {
            toast.success("Post published successfully!");
            router.push("/zone");
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-3 md:p-6">
            <div className="mx-auto w-full max-w-6xl space-y-6">

                <Button variant="outline" onClick={() => router.push('/zone')} className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Posts
                </Button>

                <Card className="p-4 md:p-6">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white">Create New Post</h2>

                    <form onSubmit={handleSubmit}>
                        {/* Two-column on md+, single column on mobile */}
                        <div className="flex flex-col md:flex-row gap-6 items-start">

                            {/* ── LEFT col: all text fields ── */}
                            <div className="flex-1 min-w-0 space-y-5">

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                                        Post Title *
                                    </label>
                                    <Input
                                        placeholder="Enter an engaging title..."
                                        value={post.title}
                                        onChange={(e) => setPost({ ...post, title: e.target.value })}
                                        className="text-lg p-3"
                                        required
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                                        Category *
                                    </label>
                                    <select
                                        value={post.category}
                                        onChange={(e) => setPost({ ...post, category: e.target.value })}
                                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white"
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                                        Content *
                                    </label>
                                    {/* Formatting toolbar */}
                                    <div className="flex flex-wrap gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-t-md border border-b-0">
                                        {[
                                            { tag: 'bold', Icon: Bold },
                                            { tag: 'italic', Icon: Italic },
                                            { tag: 'link', Icon: Link },
                                        ].map(({ tag, Icon }) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => formatText(tag)}
                                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                                title={`${tag} (select text first)`}
                                            >
                                                <Icon className="w-4 h-4" />
                                            </button>
                                        ))}
                                        <span className="hidden sm:inline text-xs text-gray-400 self-center ml-2">
                                            Select text then click to format
                                        </span>
                                    </div>
                                    <Textarea
                                        id="post-content"
                                        placeholder="Share your travel story..."
                                        value={post.content}
                                        onChange={(e) => setPost({ ...post, content: e.target.value })}
                                        rows={20}
                                        className="resize-none rounded-t-none"
                                        required
                                    />
                                </div>
                            </div>

                            {/* ── RIGHT col: image + action buttons ── */}
                            <div className="w-full md:w-72 lg:w-80 shrink-0 flex flex-col gap-5 md:sticky md:top-6">

                                {/* Image upload */}
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                                        Post Images (optional)
                                    </label>

                                    {/* Hidden file input */}
                                    <input
                                        ref={inputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />

                                    {post.images.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="relative rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                                                <img
                                                    src={post.images[post.mainImageIndex]?.preview}
                                                    alt="Main preview"
                                                    className="w-full h-56 object-cover"
                                                />
                                                <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white flex items-center gap-1.5">
                                                    <Star className="w-3.5 h-3.5 text-yellow-300" />
                                                    Main image
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => inputRef.current?.click()}
                                                    className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-md"
                                                >
                                                    <Upload className="w-3 h-3" />
                                                    Add More
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                {post.images.map((image, index) => (
                                                    <div
                                                        key={image.id}
                                                        className={`relative rounded-md overflow-hidden border-2 ${index === post.mainImageIndex ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900' : 'border-transparent'}`}
                                                    >
                                                        <img
                                                            src={image.preview}
                                                            alt={`Upload ${index + 1}`}
                                                            className="w-full h-20 object-cover cursor-pointer"
                                                            onClick={() => handleSetMainImage(index)}
                                                        />
                                                        {index === post.mainImageIndex && (
                                                            <div className="absolute left-1 top-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                                                Main
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveImage(index)}
                                                            className="absolute right-1 top-1 rounded-full bg-red-500/90 text-white p-1"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => inputRef.current?.click()}
                                            className="flex flex-col justify-center items-center w-full h-52 bg-indigo-950 hover:bg-indigo-900 rounded-md cursor-pointer gap-3 transition-colors"
                                        >
                                            <Upload className="w-8 h-8 text-indigo-300" />
                                            <span className="text-sm text-indigo-300">Click to upload one or more images</span>
                                        </button>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-col gap-3">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-green-600 hover:bg-green-700 w-full"
                                    >
                                        {loading ? "Publishing..." : "Publish Post"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push('/zone')}
                                        className="w-full"
                                    >
                                        Cancel
                                    </Button>
                                </div>

                            </div>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    )
}