"use client";

import { useRef, useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

import { X, Bold, Italic, Link, ArrowLeft, Upload, Star } from 'lucide-react';
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { useBlog } from '@/hooks/useBlog';
import { getBlogImages } from '@/lib/utils/blogHelpers';

import { categories } from '@/lib/constants'


export default function EditPostPage() {
    const router = useRouter()
    const { id } = useParams()
    const inputRef = useRef(null)

    const [post, setPost] = useState(null)

    const { getPost, updatePost, loading } = useBlog();

    useEffect(() => {
        // AFTER
        const fetchPost = async () => {
            const res = await getPost({ postId: id });

            if (!res.success) {
                alert(res.error);
                router.push(`/zone/${id}/view`);
                return;
            }

            const imageUrls = getBlogImages(res.data);
            setPost({
                ...res.data,
                images: imageUrls.map((url, index) => ({
                    id: `existing-${index}-${url}`,
                    url,
                    preview: url,
                })),
                mainImageIndex: Number.isInteger(res.data.mainImageIndex) ? res.data.mainImageIndex : 0,
            });

        };

        fetchPost();
    }, [id]);

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
        const textarea = document.getElementById('edit-content')
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

        const res = await updatePost({ id, post });

        if (!res.success) {
            toast.error(res.error);
            return;
        }

        toast.success("Post updated successfully!");
        router.push(`/zone/${id}/view`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        )
    }

    if (!post) return null

    return (
        // Same blurred-bg shell as ViewPostPage
        <div className="relative min-h-screen overflow-hidden">

            {/* Blurred background layer */}
            {post.images?.[post.mainImageIndex]?.preview && (
                <div
                    className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl"
                    style={{ backgroundImage: `url(${post.images[post.mainImageIndex].preview})` }}
                />
            )}
            {/* fallback gradient when no image */}
            {!imagePreview && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-950 to-indigo-950" />
            )}

            {/* Dark scrim */}
            <div className="absolute inset-0 bg-black/55" />

            {/* Scrollable content */}
            <div className="relative z-10 p-6 space-y-6">

                {/* Top bar */}
                <div className="flex justify-between items-center">
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/zone/${id}/view`)}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Post
                    </Button>
                </div>

                {/* Card */}
                <div className="rounded-xl bg-white/10 dark:bg-black/30 backdrop-blur-sm p-6 md:p-8 space-y-6">
                    <h2 className="text-3xl font-bold text-white">Edit Post</h2>

                    <form onSubmit={handleSubmit}>
                        {/* Two-column on md+, single column on mobile */}
                        <div className="flex flex-col md:flex-row gap-6 items-start">

                            {/* ── LEFT: text fields ── */}
                            <div className="flex-1 min-w-0 space-y-5">

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-300">
                                        Post Title *
                                    </label>
                                    <Input
                                        placeholder="Enter an engaging title..."
                                        value={post.title}
                                        onChange={(e) => setPost({ ...post, title: e.target.value })}
                                        className="text-lg p-3 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                                        required
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-300">
                                        Category *
                                    </label>
                                    <select
                                        value={post.category}
                                        onChange={(e) => setPost({ ...post, category: e.target.value })}
                                        className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white"
                                        required
                                    >
                                        <option value="" className="bg-gray-900">Select a category</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat} className="bg-gray-900">
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-300">
                                        Content *
                                    </label>
                                    {/* Formatting toolbar */}
                                    <div className="flex gap-2 p-2 bg-white/10 rounded-t-md border border-b-0 border-white/20">
                                        {[
                                            { tag: 'bold', Icon: Bold },
                                            { tag: 'italic', Icon: Italic },
                                            { tag: 'link', Icon: Link },
                                        ].map(({ tag, Icon }) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => formatText(tag)}
                                                className="p-2 hover:bg-white/20 rounded text-gray-300 hover:text-white"
                                                title={`${tag} (select text first)`}
                                            >
                                                <Icon className="w-4 h-4" />
                                            </button>
                                        ))}
                                        <span className="text-xs text-gray-400 self-center ml-2">
                                            Select text then click to format
                                        </span>
                                    </div>
                                    <Textarea
                                        id="edit-content"
                                        placeholder="Share your travel story..."
                                        value={post.content}
                                        onChange={(e) => setPost({ ...post, content: e.target.value })}
                                        rows={20}
                                        className="resize-none rounded-t-none bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                                        required
                                    />
                                </div>
                            </div>

                            {/* ── RIGHT: image upload + actions ── */}
                            <div className="w-full md:w-72 lg:w-80 shrink-0 flex flex-col gap-5 md:sticky md:top-6">

                                {/* Image upload */}
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-gray-300">
                                        Cover Image
                                    </label>

                                    <input
                                        ref={inputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />

                                    {post.images.length > 0 ? (
                                        <div className="space-y-3">
                                            <div className="relative rounded-md overflow-hidden border border-white/15">
                                                <img
                                                    src={post.images[post.mainImageIndex]?.preview}
                                                    alt="Preview"
                                                    className="w-full h-52 object-cover"
                                                />
                                                <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white flex items-center gap-1.5">
                                                    <Star className="w-3.5 h-3.5 text-yellow-300" />
                                                    Main image
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => inputRef.current?.click()}
                                                    className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-md"
                                                >
                                                    <Upload className="w-3 h-3" />
                                                    Add More
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                {post.images.map((image, index) => (
                                                    <div
                                                        key={image.id}
                                                        className={`relative rounded-md overflow-hidden border-2 ${index === post.mainImageIndex ? 'border-indigo-400 ring-2 ring-indigo-200/40' : 'border-white/10'}`}
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
                                            className="flex flex-col justify-center items-center w-full h-52 bg-white/10 hover:bg-white/20 border border-dashed border-white/30 rounded-md cursor-pointer gap-3 transition-colors"
                                        >
                                            <Upload className="w-8 h-8 text-gray-400" />
                                            <span className="text-sm text-gray-400">Click to upload one or more images</span>
                                        </button>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-col gap-3">
                                    <Button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 w-full"
                                    >
                                        Update Post
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push(`/zone/${id}/view`)}
                                        className="w-full"
                                    >
                                        Cancel
                                    </Button>
                                </div>

                            </div>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    )
}