import { doc, setDoc, Timestamp } from "firebase/firestore";
import axios from "axios";

import { db } from "@/lib/config/firebase";
import { logActivity } from "@/lib/services/firestore";
import { normalizeSearchText } from "@/lib/utils";

const uploadImageFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/media/upload`,
    formData
  );

  const url = res.data?.url || "";
  if (!url) {
    throw new Error("Image uploaded but URL missing");
  }

  return url;
};

export const createPostAction = async ({ post, profile }) => {
  try {
    const imageItems = Array.isArray(post.images) ? post.images : [];
    const imageFiles = imageItems
      .map((item) => item?.file)
      .filter((file) => typeof File !== "undefined" ? file instanceof File : Boolean(file));

    let uploadedImageUrls = [];

    if (imageFiles.length > 0) {
      try {
        for (const file of imageFiles) {
          uploadedImageUrls.push(await uploadImageFile(file));
        }
      } catch (error) {
        throw new Error(error.response?.data?.message || error.message || "Image upload failed");
      }
    } else if (post.imageFile) {
      uploadedImageUrls = [await uploadImageFile(post.imageFile)];
    }

    const mainImageIndex = Number.isInteger(post.mainImageIndex) ? post.mainImageIndex : 0;
    const mainImageUrl = uploadedImageUrls[mainImageIndex] || uploadedImageUrls[0] || "";

    // ✅ Moved OUTSIDE if block (important)
    const postId = `post_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const postData = {
      title: post.title.trim(),
      content: post.content.trim(),
      category: post.category,
      imageUrl: mainImageUrl,
      imageUrls: uploadedImageUrls,
      mainImageUrl,
      mainImageIndex,
      authorUid: profile?.uid,
      searchTitle: normalizeSearchText(post.title),
      searchCategory: normalizeSearchText(post.category),
      searchAuthor: normalizeSearchText(profile?.name || "Anonymous"),
      createdAt: Timestamp.now(),
      likes: 0,
    };

    await setDoc(doc(db, "blog_posts", postId), postData);
    await setDoc(doc(db, "blog_comments", postId), { comments: [] });

    await logActivity({
      userId: profile?.uid,
      action: "CREATE",
      entity: "BLOG",
      entityId: postId,
      metadata: { title: postData.title },
    });

    return { success: true, data: postId };

  } catch (error) {
    return { success: false, error: error.message };
  }
};