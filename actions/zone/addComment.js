import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  arrayUnion,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/config/firebase";
import { logActivity } from "@/lib/services/firestore";

export const addCommentAction = async ({ postId, text, profile }) => {
  try {
    const comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      authorUid: profile?.uid,
      createdAt: Timestamp.now(),
    };

    const ref = doc(db, "blog_comments", postId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      await updateDoc(ref, { comments: arrayUnion(comment) });
    } else {
      await setDoc(ref, { comments: [comment] });
    }

    await logActivity({
      userId: profile?.uid,
      action: snap.exists() ? "UPDATE" : "CREATE",
      entity: "COMMENT",
      entityId: postId,
      metadata: { commentId: comment.id },
    });

    return {
      success: true,
      data: {
        ...comment,
        author: profile?.name || "User",
        authorImage: profile?.avatarUrl || null,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};