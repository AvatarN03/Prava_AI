/**
 * Blog / Feed Helpers
 * renderContent  – renders basic markdown subset as HTML
 * formatRelativeDate – human-friendly relative date (today → time, this year → month/day, else → year)
 *
 * Note: renamed from `formatDate` to `formatRelativeDate` to distinguish it from
 *       the Firestore-timestamp variant in lib/utils (formatFirestoreDate / toDate).
 */

export function renderContent(content) {
  if (!content) return "";
  return content
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>'
    )
    .replace(/\n/g, "<br/>");
}

/**
 * Returns a human-friendly label for a date:
 *  - Same day  → "10:30 AM"
 *  - Same year → "Mar 5"
 *  - Older     → "2023"
 */
export function formatRelativeDate(dateObj) {
  if (!dateObj) return "Unknown date";

  const date = dateObj instanceof Date ? dateObj : new Date(dateObj);
  const now = new Date();

  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (sameDay) {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  }

  return date.getFullYear().toString();
}

export function getBlogImages(post) {
  if (!post) return [];

  const images = Array.isArray(post.imageUrls) ? post.imageUrls.filter(Boolean) : [];

  if (images.length > 0) {
    return images;
  }

  if (post.imageUrl) {
    return [post.imageUrl];
  }

  return [];
}

export function getMainBlogImage(post) {
  const images = getBlogImages(post);
  if (images.length === 0) return "";

  const mainImageUrl = post?.mainImageUrl || post?.imageUrl;
  if (mainImageUrl && images.includes(mainImageUrl)) {
    return mainImageUrl;
  }

  const mainIndex = Number.isInteger(post?.mainImageIndex) ? post.mainImageIndex : 0;
  return images[mainIndex] || images[0] || "";
}

export function normalizeBlogPost(post) {
  if (!post) return post;

  const images = getBlogImages(post);
  const mainImageUrl = getMainBlogImage(post);

  return {
    ...post,
    imageUrls: images,
    mainImageUrl,
    imageUrl: mainImageUrl || post.imageUrl || "",
  };
}