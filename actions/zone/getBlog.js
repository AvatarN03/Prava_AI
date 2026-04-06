import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/config/firebase";
import { normalizeBlogPost } from "@/lib/utils/blogHelpers";
import { getUserProfilesMap, resolveAuthorFields } from "@/lib/services/userProfileResolver";

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

    const profileMap = await getUserProfilesMap([post.authorUid]);
    const enrichedPost = {
      ...post,
      ...resolveAuthorFields({
        uid: post.authorUid,
        fallbackName: post.author,
        fallbackImage: post.authorImage,
        profileMap,
      }),
    };

    return { success: true, data: enrichedPost };
  } catch (error) {
    return { success: false, error: error.message };
  }
};