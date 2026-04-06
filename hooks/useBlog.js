"use client";

import { addCommentAction } from "@/actions/zone/addComment";
import { createPostAction } from "@/actions/zone/createBlog";
import { deletePostAction } from "@/actions/zone/deleteBlog";
import { deleteCommentAction } from "@/actions/zone/deleteComment";
import { getPostAction } from "@/actions/zone/getBlog";
import { getPostsAction } from "@/actions/zone/getPosts";
import { getCommentsAction } from "@/actions/zone/getComment";
import { updatePostAction } from "@/actions/zone/updateBlog";
import { updateCommentAction } from "@/actions/zone/updateComment";
import { useState } from "react";

export const useBlog = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAsync = async (fn) => {
    try {
      setError(null);
      const res = await fn();

      if (!res?.success) {
        throw new Error(res?.error || "Something went wrong");
      }

      return res;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ CREATE
  const createPost = async ({ post, profile }) => {
    setLoading(true);
    return handleAsync(() => createPostAction({ post, profile }));
  };

  // ✅ DELETE
  const deletePost = async ({ postId, profile }) => {
    setLoading(true);
    return handleAsync(() => deletePostAction({ postId, profile }));
  };

  // ✅ GET ALL POSTS
  const getPosts = async ({ searchQuery, pageSize } = {}) => {
    setLoading(true);
    return handleAsync(() => getPostsAction({ searchQuery, pageSize }));
  };

  // ✅ GET POST
  const getPost = async ({ postId }) => {
    setLoading(true);
    return handleAsync(() => getPostAction({ postId }));
  };

   const updatePost = async ({ id, post, newImageFile }) => {
    setLoading(true);
    setError(null);

    const res = await updatePostAction({ id, post, newImageFile });

    if (!res.success) setError(res.error);

    setLoading(false);
    return res;
  };

  // ✅ GET COMMENTS
  const getComments = async ({ postId }) => {
    setLoading(true);
    return handleAsync(() => getCommentsAction({ postId }));
  };

  // ✅ ADD COMMENT
  const addComment = async ({ postId, text, profile }) => {
    setLoading(true);
    return handleAsync(() => addCommentAction({ postId, text, profile }));
  };

  // ✅ UPDATE COMMENT
const updateComment = async ({ postId, commentId, text }) => {
  setLoading(true);
  return handleAsync(() =>
    updateCommentAction({ postId, commentId, text })
  );
};

  // ✅ DELETE COMMENT
  const deleteComment = async ({ postId, comments, commentId, profile }) => {
    setLoading(true);
    return handleAsync(() =>
      deleteCommentAction({ postId, comments, commentId, profile }),
    );
  };


  return {
  createPost,
  deletePost,
  getPosts,
  getPost,
  updatePost,
  getComments,
  addComment,
  updateComment,
  deleteComment,
  loading,
  error,
};
};
