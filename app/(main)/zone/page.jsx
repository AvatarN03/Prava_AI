"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Search, X, MessageCircle, Plus, Edit2 } from "lucide-react";

import { useAuth } from "@/context/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBlog } from "@/hooks/useBlog";
import {
  formatRelativeDate,
  renderContent,
  getMainBlogImage,
  getBlogImages,
} from "@/lib/utils/blogHelpers";

const BlogListPage = () => {
  const router = useRouter();
  const { profile } = useAuth();
  const { getPosts, loading } = useBlog();

  const [posts, setPosts] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [comments, setComments] = useState({});

  useEffect(() => {
    loadData(searchQuery);
  }, [searchQuery]);

  const loadData = async (queryText = "") => {
    const res = await getPosts({ searchQuery: queryText });
    if (!res.success) {
      console.error("Error loading data:", res.error);
      return;
    }

    setPosts(res.data.posts);
    setComments(res.data.commentsMap);
  };

  const handleSearch = () => {
    setSearchQuery(inputValue);
  };

  const handleClearSearch = () => {
    setInputValue("");
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-3 md:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">✈️ Travel Blog</h1>
          <p className="text-gray-600 dark:text-gray-400 text-md">
            Share your adventures and discover stories from around the world
          </p>
        </div>

        <div className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 flex items-center w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by title, content, category or author..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 pr-10 w-full"
            />
            {inputValue && (
              <button
                onClick={() => setInputValue("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button className="flex-1 sm:flex-none" onClick={handleSearch}>Search</Button>
            {searchQuery && (
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleClearSearch}>
                Clear
              </Button>
            )}
          </div>

          {searchQuery && (
            <p className="w-full text-xs text-gray-500 pl-1 sm:w-auto">
              {posts.length} result{posts.length !== 1 ? "s" : ""}
            </p>
          )}

          <Button
            onClick={() => router.push("/zone/create")}
            className="flex items-center gap-2 px-5 py-3 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            New Post
          </Button>
        </div>

        <div className="space-y-8">
          {posts.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {searchQuery
                  ? "No posts found matching your search."
                  : "No posts yet. Be the first to share your travel story!"}
              </p>
              {!searchQuery && (
                <Button onClick={() => router.push("/zone/create")}>Write First Post</Button>
              )}
            </Card>
          ) : (
            posts.map((post) => {
              const mainImage = getMainBlogImage(post);
              const imageCount = getBlogImages(post).length;

              return (
                <div
                  key={post.id}
                  className="overflow-hidden md:h-70 max-h-80 hover:shadow-lg transition-shadow cursor-pointer rounded-lg bg-gray-100 dark:bg-gray-800 h-full"
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

                    <div className={`p-3 md:p-6 flex flex-col justify-between ${mainImage ? "md:w-2/3" : "w-full"}`}>
                      <div className="space-y-4">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2" title={post.title}>
                          {post.title}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>✍️ @{post.authorUsername || post.author || "anonymous"}</span>
                          <span className="text-right">📅 {formatRelativeDate(post.createdAt)}</span>
                          <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-3xl w-fit text-xs font-medium">
                            {post.category}
                          </span>
                        </div>
                        <div
                          className="text-gray-600 flex flex-1 dark:text-gray-400 text-sm line-clamp-2"
                          dangerouslySetInnerHTML={{
                            __html:
                              renderContent((post.content || "").substring(0, 160)) +
                              ((post.content || "").length > 160 ? "..." : ""),
                          }}
                        />
                        {imageCount > 1 && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">{imageCount} photos</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 ">
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm">
                          <MessageCircle className="w-4 h-4" />
                          <span>{(comments[post.id] || []).length} comments</span>
                        </div>

                        {post.authorUid === profile?.uid && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/zone/${post.id}/edit`);
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogListPage;
