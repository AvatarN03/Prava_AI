import { doc, updateDoc, Timestamp } from "firebase/firestore";
import axios from "axios";

import { db } from "@/lib/config/firebase";
import { normalizeSearchText } from "@/lib/utils";

const uploadImageFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post("/api/media/upload", formData);
  const url = res.data?.url || "";

  if (!url) {
    throw new Error("Image uploaded but URL missing");
  }

  return url;
};

const deleteImageByUrl = async (url) => {
  if (!url) return;

  try {
    await axios.delete("/api/media/upload", {
      data: { url },
    });
  } catch (error) {
    console.warn("Failed to delete old Cloudinary image:", url, error?.message || error);
  }
};

export const updatePostAction = async ({ id, post, newImageFile }) => {
  try {
    const imageItems = Array.isArray(post.images) && post.images.length > 0
      ? post.images
      : post.imageUrls?.length
        ? post.imageUrls.map((url) => ({ url }))
        : post.imageUrl
          ? [{ url: post.imageUrl }]
          : [];

    const previousImageUrls = imageItems
      .map((item) => item?.url)
      .filter(Boolean);

    let finalImageUrls = [];

    if (imageItems.length > 0) {
      for (const item of imageItems) {
        if (item?.file) {
          finalImageUrls.push(await uploadImageFile(item.file));
        } else if (item?.url) {
          finalImageUrls.push(item.url);
        }
      }
    } else if (newImageFile) {
      finalImageUrls = [await uploadImageFile(newImageFile)];
    }

    const requestedMainIndex = Number.isInteger(post.mainImageIndex) ? post.mainImageIndex : 0;
    const mainImageIndex = finalImageUrls.length > 0
      ? Math.min(Math.max(requestedMainIndex, 0), finalImageUrls.length - 1)
      : 0;
    const mainImageUrl = finalImageUrls[mainImageIndex] || finalImageUrls[0] || "";

    await updateDoc(doc(db, "blog_posts", id), {
      title: post.title.trim(),
      content: post.content.trim(),
      category: post.category,
      searchTitle: normalizeSearchText(post.title),
      searchCategory: normalizeSearchText(post.category),
      searchAuthor: normalizeSearchText(post.author),
      imageUrl: mainImageUrl,
      imageUrls: finalImageUrls,
      mainImageUrl,
      mainImageIndex,
      updatedAt: Timestamp.now(),
    });

    const removedImageUrls = previousImageUrls.filter(
      (url) => !finalImageUrls.includes(url),
    );

    if (removedImageUrls.length > 0) {
      await Promise.all(removedImageUrls.map((url) => deleteImageByUrl(url)));
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};