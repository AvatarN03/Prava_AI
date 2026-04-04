"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { ArrowLeft, Edit2, MessageCircle, SquareArrowOutUpRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { CommentCard } from "@/components/features/zone/CommentCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import { useAuth } from "@/context/useAuth";
import { useBlog } from "@/hooks/useBlog";
import { formatRelativeDate, renderContent, getBlogImages, getMainBlogImage } from "@/lib/utils/blogHelpers";

export default function ViewPostPage() {
  const router = useRouter();
  const { id } = useParams();
  const { profile } = useAuth();
  const { getPost, getComments, updatePost, updateComment, addComment, deleteComment, deletePost } = useBlog();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const postRes = await getPost({ postId: id });
      if (!postRes.success) {
        toast.error(postRes.error);
        router.push("/zone");
        return;
      }

      setPost(postRes.data);

      const commentRes = await getComments({ postId: id });
      if (commentRes.success) {
        setComments(commentRes.data);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    const res = await deletePost({ postId: id, profile });
    if (res.success) {
      toast.success("Post deleted successfully!");
      router.push("/zone");
    } else {
      toast.error(res.error || "Failed to delete post.");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    const res = await addComment({ postId: id, text: newComment, profile });
    if (res.success) {
      setComments((prev) => [...prev, { ...res.data, createdAt: new Date() }]);
      setNewComment("");
      toast.success("Comment added!");
    } else {
      toast.error(res.error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const res = await deleteComment({ postId: id, comments, commentId, profile });
    if (res.success) {
      setComments(res.data);
      toast.success("Deleted!");
    } else {
      toast.error(res.error);
    }
  };

  const handleUpdateComment = async (commentId, text) => {
    const res = await updateComment({ postId: post.id, commentId, text });
    if (res.success) {
      setComments((prev) => prev.map((comment) => (comment.id === commentId ? { ...comment, text } : comment)));
    }
  };

  const isPostOwner = post?.authorUid === profile?.uid;

  const handleSetMainImage = async (index) => {
    if (!isPostOwner) return;

    const images = getBlogImages(post);
    const res = await updatePost({
      id,
      post: {
        ...post,
        images: images.map((url) => ({ url })),
        mainImageIndex: index,
      },
    });

    if (res.success) {
      setPost((prev) => {
        const updatedImages = getBlogImages(prev);
        return {
          ...prev,
          mainImageIndex: index,
          mainImageUrl: updatedImages[index] || updatedImages[0] || prev.mainImageUrl,
          imageUrl: updatedImages[index] || updatedImages[0] || prev.imageUrl,
        };
      });
      toast.success("Main image updated!");
    } else {
      toast.error(res.error || "Failed to update main image");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!post) return null;

  const shouldTruncate = (post.content || "").length > 300;
  const postImages = getBlogImages(post);
  const mainImage = getMainBlogImage(post);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {mainImage && (
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl"
          style={{ backgroundImage: `url(${mainImage})` }}
        />
      )}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 p-2 md:p-6 space-y-6">
        <div className="flex justify-between items-center gap-3">
          <Button variant="outline" onClick={() => router.push("/zone")} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {isPostOwner && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/zone/${id}/edit`)} className="flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                <span className="hidden md:inline">Edit Post</span>
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">Delete Post</span>
              </Button>
            </div>
          )}
        </div>

        <div className="p-3 md:p-8 space-y-6 bg-white/5 dark:bg-black/30 backdrop-blur-sm rounded-xl">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-base font-semibold opacity-60">Title:</Label>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{post.title}</h1>
            </div>

            <div className="grid grid-cols-2 items-center gap-3 text-sm text-gray-300">
              <Link href={`/zone/authors/${post.authorUid}`} className="flex items-center gap-2 rounded-md w-fit px-3 py-2 group">
                <Avatar className="relative w-11 h-11 ring-2 ring-white dark:ring-gray-800">
                  <AvatarImage src={post?.authorImage} alt={post?.author || "Profile"} />
                </Avatar>
                <span className="font-medium text-gray-200 group-hover:text-indigo-200">{post.author}</span>
              </Link>
              <div className="flex flex-col items-end gap-1 text-sm text-gray-400">
                <span>📅 {formatRelativeDate(post.createdAt)}</span>
                {post.updatedAt && <span>✏️ {formatRelativeDate(post.updatedAt)}</span>}
              </div>
            </div>

            <span className="inline-block px-4 py-1.5 bg-indigo-500/50 text-indigo-200 rounded-full text-sm font-medium">
              {post.category}
            </span>
          </div>

          <Accordion type="multiple" defaultValue={["gallery", "description", "comments"]} className="space-y-3">
            {mainImage && (
              <AccordionItem value="gallery" className="rounded-xl border border-white/10 bg-black/20 px-4 shadow-sm backdrop-blur-sm">
                <AccordionTrigger className="py-4 text-white hover:no-underline">
                  <span className="flex flex-col items-start gap-1 text-left">
                    <span className="text-base font-semibold">Photo Gallery</span>
                    <span className="text-xs text-gray-300">
                      {postImages.length} image{postImages.length === 1 ? "" : "s"}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pt-0">
                  <div className="space-y-4">
                    <div className="relative w-full aspect-video overflow-hidden rounded-md">
                      <img
                        src={mainImage}
                        alt={post.title}
                        className="w-full h-full object-cover object-center rounded-lg shadow-lg hover:scale-105 cursor-pointer transition-transform duration-300"
                      />
                      <div className="absolute right-4 bottom-4 rounded-full bg-gray-800/80">
                        <Link href={mainImage} target="_blank" className="block p-2">
                          <SquareArrowOutUpRight className="w-4 h-4 md:w-5 md:h-5" />
                        </Link>
                      </div>
                    </div>

                    {postImages.length > 1 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {postImages.map((imageUrl, index) => {
                          const isMain = imageUrl === mainImage;
                          return (
                            <div
                              key={`${imageUrl}-${index}`}
                              className={`relative overflow-hidden rounded-lg border ${isMain ? "border-indigo-400 ring-2 ring-indigo-300/40" : "border-white/10"}`}
                            >
                              <button
                                type="button"
                                onClick={() => handleSetMainImage(index)}
                                className="block w-full text-left"
                                title={isPostOwner ? "Set as main image" : "Gallery image"}
                              >
                                <img src={imageUrl} alt={`${post.title} ${index + 1}`} className="h-28 w-full object-cover" />
                              </button>
                              <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">
                                {isMain ? "Main" : `#${index + 1}`}
                              </div>
                              {isPostOwner && !isMain && (
                                <button
                                  type="button"
                                  onClick={() => handleSetMainImage(index)}
                                  className="absolute bottom-2 right-2 rounded-full bg-indigo-600/90 px-3 py-1 text-[11px] font-medium text-white hover:bg-indigo-500"
                                >
                                  Set main
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="description" className="rounded-xl border border-white/10 bg-black/20 px-4 shadow-sm backdrop-blur-sm">
              <AccordionTrigger className="py-4 text-white hover:no-underline">
                <span className="flex flex-col items-start gap-1 text-left">
                  <span className="text-base font-semibold">Description</span>
                  <span className="text-xs text-gray-300">Read the full post content</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-0">
                <div className="text-gray-100 prose prose-invert max-w-none text-base md:text-lg leading-relaxed">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: isExpanded || !shouldTruncate
                        ? renderContent(post.content)
                        : renderContent((post.content || "").substring(0, 300)) + "...",
                    }}
                  />
                  {shouldTruncate && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-indigo-300 hover:underline font-medium mt-4 block"
                    >
                      {isExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="comments" className="rounded-xl border border-white/10 bg-black/20 px-4 shadow-sm backdrop-blur-sm">
              <AccordionTrigger className="py-4 text-white hover:no-underline">
                <span className="flex items-center gap-2 text-left">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-base font-semibold">Comments ({comments.length})</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-0">
                <div className="space-y-5">
                  <form onSubmit={handleAddComment} className="flex gap-3 items-start">
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder="Share your thoughts..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={2}
                        className="resize-none bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-sm"
                      />
                      <Button type="submit">Post Comment</Button>
                    </div>
                  </form>

                  {comments.length > 0 ? (
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <CommentCard
                          key={comment.id}
                          comment={comment}
                          canEdit={comment.authorUid === profile?.uid}
                          canDelete={comment.authorUid === profile?.uid || isPostOwner}
                          onEdit={handleUpdateComment}
                          onDelete={() => handleDeleteComment(comment.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8 text-sm">
                      No comments yet. Be the first to share your thoughts!
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
