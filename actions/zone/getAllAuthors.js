import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { getUserProfilesMap } from "@/lib/services/userProfileResolver";

export const getAllAuthorsAction = async () => {
  try {
    const postsSnap = await getDocs(collection(db, "blog_posts"));
    const userProfiles = await getUserProfilesMap(
      postsSnap.docs.map((d) => d.data()?.authorUid),
    );

    const authorMap = {};
    postsSnap.docs.forEach((d) => {
      const data = d.data();
      const uid = data.authorUid;
      if (!uid) return;

      const profile = userProfiles[uid];

      if (!authorMap[uid]) {
        authorMap[uid] = {
          uid,
          name: profile?.name || data.author || "Anonymous",
          avatarImage: profile?.avatarUrl || data.authorImage || null,
          postCount: 0,
        };
      }
      authorMap[uid].postCount += 1;
    });

    const authors = Object.values(authorMap).sort((a, b) => b.postCount - a.postCount);

    return { success: true, data: authors };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
