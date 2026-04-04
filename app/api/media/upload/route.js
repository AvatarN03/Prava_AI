// app/api/upload/route.js
import { NextResponse } from "next/server";

import cloudinary from "@/lib/config/cloudinary"

const CLOUDINARY_UPLOAD_FOLDER = "ai-tour-3";

const getPublicIdFromCloudinaryUrl = (url) => {
  if (!url || typeof url !== "string") return "";

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("res.cloudinary.com")) return "";

    const marker = "/upload/";
    const uploadIndex = parsed.pathname.indexOf(marker);
    if (uploadIndex === -1) return "";

    const pathAfterUpload = decodeURIComponent(
      parsed.pathname.slice(uploadIndex + marker.length),
    );

    const segments = pathAfterUpload.split("/").filter(Boolean);
    if (segments.length === 0) return "";

    const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
    const publicIdSegments = versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments;
    if (publicIdSegments.length === 0) return "";

    const lastIndex = publicIdSegments.length - 1;
    publicIdSegments[lastIndex] = publicIdSegments[lastIndex].replace(/\.[^/.]+$/, "");

    const publicId = publicIdSegments.join("/");
    return publicId.startsWith(`${CLOUDINARY_UPLOAD_FOLDER}/`) ? publicId : "";
  } catch {
    return "";
  }
};

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
      .upload_stream({ folder: CLOUDINARY_UPLOAD_FOLDER }, (error, result) => {
        if (error) reject(error)
          else resolve(result)
      })
      .end(buffer)
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (error) {
    console.error("Upload Error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const imageUrl = body?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const publicId = getPublicIdFromCloudinaryUrl(imageUrl);
    if (!publicId) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });

    return NextResponse.json({
      success: true,
      result: result?.result || "unknown",
      publicId,
    });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
