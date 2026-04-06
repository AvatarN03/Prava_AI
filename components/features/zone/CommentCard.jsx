
import { useState } from "react"

import { Check, X } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage } from "@/components/ui/avatar"

import { CommentMenu } from "./CommentMenu"

import { formatRelativeDate } from "@/lib/utils/blogHelpers"


export function CommentCard({ comment, canDelete, canEdit, onDelete, onEdit }) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(comment.text)
    const [saving, setSaving] = useState(false)


    const handleSave = async () => {
        if (!draft.trim()) return
        setSaving(true)
        await onEdit(comment.id, draft.trim())
        setSaving(false)
        setEditing(false)
    }

    const handleCancel = () => {
        setDraft(comment.text)
        setEditing(false)
    }

    return (
        <Card className="p-2 bg-white/10 border-white/15">
            {/* Top row: avatar + name + date + menu */}
            <CardHeader className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                    <Avatar className="relative w-11 h-11 ring-2 ring-white dark:ring-gray-800">
                        <AvatarImage
                            src={comment?.authorImage || "/profile.png"}
                            alt={comment?.author || "Profile"}
                        />

                    </Avatar>
                    <div>
                        <p className="font-semibold text-white text-sm leading-tight">@{comment.authorUsername || comment.author || "anonymous"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatRelativeDate(comment.createdAt)}</p>
                    </div>
                </div>

                {(canDelete || canEdit) && (
                    <CommentMenu
                        onEdit={canEdit ? () => setEditing(true) : undefined}
                        onDelete={canDelete ? onDelete : undefined}
                    />
                )}
            </CardHeader>

            {/* Comment body */}
            <CardContent>

                {editing ? (
                    <div className="space-y-2">
                        <Textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            rows={2}
                            className="resize-none bg-white/10 border-white/20 text-white text-sm"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={saving || !draft.trim()}
                               
                            >
                                <Check className="w-3.5 h-3.5" />
                                {saving ? 'Saving…' : 'Save'}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancel}
                                className="flex items-center gap-1.5"
                            >
                                <X className="w-3.5 h-3.5" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-200 text-sm leading-relaxed">{comment.text}</p>
                )}
            </CardContent>
        </Card>
    )
}
