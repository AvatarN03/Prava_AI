import { collection, getDocs, limit, query, where } from "firebase/firestore";

import { db } from "@/lib/config/firebase";
import { normalizeSearchText } from "@/lib/utils";
import { matchesBlogSearch, normalizeBlogPost } from "@/lib/utils/blogHelpers";

const mapPostDocument = (d) => {
  const data = d.data();
  return normalizeBlogPost({
    id: d.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
    updatedAt:
      data.updatedAt?.toDate?.() ||
      (data.updatedAt ? new Date(data.updatedAt) : null),
  });
};

export const getPostsAction = async ({ searchQuery = "", pageSize = 30 } = {}) => {
  try {
    const normalizedTerm = normalizeSearchText(searchQuery);
    const postsRef = collection(db, "blog_posts");

    let posts = [];

    if (normalizedTerm) {
      const [titleSnap, categorySnap, authorSnap] = await Promise.all([
        getDocs(
          query(
            postsRef,
            where("searchTitle", ">=", normalizedTerm),
            where("searchTitle", "<=", `${normalizedTerm}\uf8ff`),
            limit(pageSize),
          ),
        ),
        getDocs(
          query(
            postsRef,
            where("searchCategory", ">=", normalizedTerm),
            where("searchCategory", "<=", `${normalizedTerm}\uf8ff`),
            limit(pageSize),
          ),
        ),
        getDocs(
          query(
            postsRef,
            where("searchAuthor", ">=", normalizedTerm),
            where("searchAuthor", "<=", `${normalizedTerm}\uf8ff`),
            limit(pageSize),
          ),
        ),
      ]);

      const merged = new Map();
      [titleSnap, categorySnap, authorSnap].forEach((snap) => {
        snap.docs.forEach((d) => {
          merged.set(d.id, mapPostDocument(d));
        });
      });

      posts = Array.from(merged.values());

      // Fallback for legacy posts that don't have search fields yet.
      if (posts.length === 0) {
        const allPostsSnap = await getDocs(postsRef);
        posts = allPostsSnap.docs
          .map((d) => mapPostDocument(d))
          .filter((post) => matchesBlogSearch(post, normalizedTerm));
      }
    } else {
      const postsSnap = await getDocs(postsRef);
      posts = postsSnap.docs.map((d) => mapPostDocument(d));
    }

    posts = posts
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, normalizedTerm ? pageSize : posts.length);

    const visiblePostIds = new Set(posts.map((post) => post.id));

    const commentsSnap = await getDocs(collection(db, "blog_comments"));
    const commentsMap = {};
    commentsSnap.docs.forEach((d) => {
      if (!visiblePostIds.has(d.id)) return;

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
