import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/config/firebase";
import { normalizeBlogPost } from "@/lib/utils/blogHelpers";

export const getPostAction = async ({ postId }) => {
  try {
    const postSnap = await getDoc(doc(db, "blog_posts", postId));

    if (!postSnap.exists()) {
      return { success: false, error: "Post not found" };
    }

    const data = postSnap.data();

    const post = normalizeBlogPost({
      id: postSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt:
        data.updatedAt?.toDate?.() ||
        (data.updatedAt ? new Date(data.updatedAt) : null),
    });

    return { success: true, data: post };
  } catch (error) {
    return { success: false, error: error.message };
  }
};