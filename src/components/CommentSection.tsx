import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase-client'
import { CommentItem } from './CommentItem'

interface CommentSectionProps {
  postId: number
}

export interface Comment {
  id: number
  post_id: number
  parent_comment_id: number | null
  content: string
  user_id: string
  created_at: string
  author: string
}

interface NewComment {
  content: string
  parent_comment_id?: number | null
}

async function createComment(
  newComment: NewComment,
  postId: number,
  userId?: string,
  author?: string
) {
  if (!userId || !author) {
    throw new Error('You must be logged in to comment.')
  }

  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    content: newComment.content,
    parent_comment_id: newComment.parent_comment_id || null,
    user_id: userId,
    author: author,
  })

  if (error) throw new Error(error.message)
}

async function fetchComments(postId: number): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  if (error) {
    throw new Error(error.message)
  }
  return data as Comment[]
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [newCommentText, setNewCommentText] = useState<string>('')
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const {
    data: comments,
    isLoading,
    error,
  } = useQuery<Comment[], Error>({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
    // refetchInterval: 5000, //update de votes auto
  })

  const { mutate, isPending, isError } = useMutation({
    mutationFn: (newComment: NewComment) =>
      createComment(
        newComment,
        postId,
        user?.id,
        user?.user_metadata.user_name
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['comments', postId],
      })
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!newCommentText) return

    mutate({ content: newCommentText, parent_comment_id: null })
    setNewCommentText('')
  }

  /*
  Map dos comments -> Organiza as respostas -> Retorna uma árvore
  Vai retornar ou uma lista de comentários ou um comentário que tem uma lista de comentários
  */
  function buildCommentTree(
    flatListOfComments: Comment[]
  ): (Comment & { children?: Comment[] })[] {
    //number vai ser a key, o valor é o resto
    const map = new Map<number, Comment & { children?: Comment[] }>()
    const roots: (Comment & { children?: Comment[] })[] = []

    // biome-ignore lint/complexity/noForEach: <explanation>
    flatListOfComments.forEach((comment) => {
      map.set(comment.id, { ...comment, children: [] })
    })

    // biome-ignore lint/complexity/noForEach: <explanation>
    flatListOfComments.forEach((comment) => {
      //verifica se o comentário é um reply a outro comentário -> se sim queremos pegar o comentário pai desde reply
      if (comment.parent_comment_id) {
        const parent = map.get(comment.parent_comment_id)
        if (parent) {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          parent.children?.push(map.get(comment.id)!)
        }
      } else {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        roots.push(map.get(comment.id)!)
      }
    })
    return roots
  }

  const commentTree = comments ? buildCommentTree(comments) : []

  if (isLoading) {
    return <div>Loading comments...</div>
  }

  if (error) {
    return <div>Error:{error.message}</div>
  }

  return (
    <div className="mt-6">
      {/* create comments section */}
      <h3 className="text-2xl font-semibold mb-4">Comments</h3>
      {user ? (
        <form onSubmit={handleSubmit}>
          <textarea
            className="w-full border border-white/10 bg-transparent p-2 rounded"
            placeholder="Write a comment..."
            rows={3}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
          />
          <button
            className="mt-2 bg-purple-500 text-white px-4 py-2 rounded hover:cursor-pointer hover:bg-purple-700"
            type="submit"
            disabled={!newCommentText}
          >
            {isPending ? (
              <p className="font-semibold">Posting...</p>
            ) : (
              <p className="font-semibold">Post a comment</p>
            )}
          </button>
          {isError && (
            <p className="text-red-500 mt-2">Error posting comment</p>
          )}
        </form>
      ) : (
        <p className="mb-4 text-gray-600">
          You must be logged in to post a comment
        </p>
      )}

      {/* Comments Display Section */}
      <div className="space-y-4">
        {commentTree.map((comment) => (
          <CommentItem key={comment.id} comment={comment} postId={postId} />
        ))}
      </div>
    </div>
  )
}
