import { doc, getDoc } from "firebase/firestore";

import { db } from "@/lib/config/firebase";
import { getUserProfilesMap, resolveAuthorFields } from "@/lib/services/userProfileResolver";

export const getCommentsAction = async ({ postId }) => {
  try {
    const snap = await getDoc(doc(db, "blog_comments", postId));

    if (!snap.exists()) {
      return { success: true, data: [] };
    }

    const comments = (snap.data().comments || []).map((c) => ({
      ...c,
      createdAt: c.createdAt?.toDate?.() || new Date(c.createdAt),
    }));

    const profileMap = await getUserProfilesMap(comments.map((comment) => comment.authorUid));
    const enrichedComments = comments.map((comment) => ({
      ...comment,
      ...resolveAuthorFields({
        uid: comment.authorUid,
        fallbackName: comment.author,
        fallbackImage: comment.authorImage,
        profileMap,
      }),
    }));

    return { success: true, data: enrichedComments };
  } catch (error) {
    return { success: false, error: error.message };
  }
};