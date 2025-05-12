import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase-client'
import type { Comment } from './CommentSection'

interface CommentItemProps {
  comment: Comment & {
    children?: Comment[]
  }
  postId: number
}

async function createReply(
  replyContent: string,
  postId: number,
  parentCommentId: number,
  userId?: string,
  author?: string
) {
  if (!userId || !author) {
    throw new Error('You must be logged in to reply.')
  }

  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    content: replyContent,
    parent_comment_id: parentCommentId,
    user_id: userId,
    author: author,
  })

  if (error) throw new Error(error.message)
}

export function CommentItem({ comment, postId }: CommentItemProps) {
  const [showReply, setShowReply] = useState<boolean>(false)
  const [replyText, setReplyText] = useState<string>('')
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)

  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (replyContent: string) =>
      createReply(
        replyContent,
        postId,
        comment.id,
        user?.id,
        user?.user_metadata.user_name
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['comments', postId],
      })
      setReplyText('')
      setShowReply(false)
    },
  })

  function handleReplySubmit(e: FormEvent) {
    e.preventDefault()

    if (!replyText) return

    mutate(replyText)
  }

  return (
    <div className="pl-4 border-1 border-white/10 mt-4">
      <div className="mb-2">
        {/* Username dos comentaristas  */}
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-sm font-bold text-blue-400">
            {comment.author}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
        </div>

        <p className="text-gray-300">{comment.content}</p>
        <button
          className="text-blue-500 text-sm mt-1"
          type="button"
          onClick={() => setShowReply((prev) => !prev)}
        >
          {showReply ? 'Cancel' : 'Reply'}
        </button>
      </div>

      {showReply && user && (
        <form onSubmit={handleReplySubmit} className="mb-2">
          <textarea
            className="w-full border border-white/10 bg-transparent p-2 rounded"
            placeholder="Write a reply..."
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button
            className="mt-1 bg-blue-500 text-white px-3 py-1 rounded hover:cursor-pointer hover:bg-purple-700"
            type="submit"
            disabled={!replyText}
          >
            {isPending ? (
              <p className="font-semibold">Posting...</p>
            ) : (
              <p className="font-semibold">Post reply</p>
            )}
          </button>
          {isError && <p className="text-red-500 mt-2">Error posting reply</p>}
        </form>
      )}

      {comment.children && comment.children.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            title={isCollapsed ? 'Hide Replies' : 'Show Replies'}
          >
            {isCollapsed ? (
              // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
              // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            )}
          </button>

          {!isCollapsed && (
            <div className="space-y-2">
              {comment.children.map((child) => (
                <CommentItem key={child.id} comment={child} postId={postId} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
