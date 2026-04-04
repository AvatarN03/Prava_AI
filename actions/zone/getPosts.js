import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/config/firebase";
import { normalizeBlogPost } from "@/lib/utils/blogHelpers";

export const getPostsAction = async () => {
  try {
    const postsSnap = await getDocs(collection(db, "blog_posts"));
    const posts = postsSnap.docs
      .map((d) => {
        const data = d.data();
        return normalizeBlogPost({
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt:
            data.updatedAt?.toDate?.() ||
            (data.updatedAt ? new Date(data.updatedAt) : null),
        });
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    const commentsSnap = await getDocs(collection(db, "blog_comments"));
    const commentsMap = {};
    commentsSnap.docs.forEach((d) => {
      commentsMap[d.id] = (d.data().comments || []).map((c) => ({
        ...c,
        createdAt: c.createdAt?.toDate?.() || new Date(c.createdAt),
      }));
    });

    return { success: true, data: { posts, commentsMap } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
