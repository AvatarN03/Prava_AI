import { collection, documentId, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/config/firebase";

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

export const getUserProfilesMap = async (uids = []) => {
  const uniqueUids = Array.from(new Set((uids || []).filter(Boolean)));
  if (uniqueUids.length === 0) return {};

  const uidChunks = chunk(uniqueUids, 10);
  const map = {};

  for (const ids of uidChunks) {
    const q = query(collection(db, "users"), where(documentId(), "in", ids));
    const snap = await getDocs(q);

    snap.docs.forEach((d) => {
      const data = d.data() || {};
      map[d.id] = {
        uid: d.id,
        name: data.name || data.username || "Anonymous",
        avatarUrl: data.avatarUrl || null,
        username: data.username || "",
      };
    });
  }

  return map;
};

export const resolveAuthorFields = ({ uid, fallbackName, fallbackImage, profileMap }) => {
  const profile = uid ? profileMap?.[uid] : null;
  return {
    author: profile?.name || fallbackName || "Anonymous",
    authorImage: profile?.avatarUrl || fallbackImage || null,
  };
};
