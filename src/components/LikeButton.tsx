import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase-client'

interface LikeButtonProps {
  postId: number
}

interface Vote {
  id: number
  post_id: number
  user_id: string
  vote: number
}

async function vote(voteValue: number, postId: number, userId: string) {
  const { data: existingVote } = await supabase
    .from('votes')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle()

  //voto já existe no bd
  if (existingVote) {
    //remover o like => passar para 0
    if (existingVote.vote === voteValue) {
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('id', existingVote.id)

      if (error) {
        throw new Error(error.message)
      }

      return
    }

    //atualiza voto
    const { error } = await supabase
      .from('votes')
      .update({ vote: voteValue })
      .eq('id', existingVote.id)

    if (error) {
      throw new Error(error.message)
    }

    return
  }

  //new vote
  const { error } = await supabase
    .from('votes')
    .insert({ post_id: postId, user_id: userId, vote: voteValue })
  if (error) {
    throw new Error(error.message)
  }
}

async function fetchVotes(postId: number): Promise<Vote[]> {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('post_id', postId)

  if (error) {
    throw new Error(error.message)
  }
  return data as Vote[]
}

export function LikeButton({ postId }: LikeButtonProps) {
  const { user } = useAuth()

  const queryClient = useQueryClient()

  const {
    data: votes,
    isLoading,
    error,
  } = useQuery<Vote[], Error>({
    queryKey: ['votes', postId],
    queryFn: () => fetchVotes(postId),
    // refetchInterval: 5000, //update de votes auto
  })

  const { mutate } = useMutation({
    mutationFn: (voteValue: number) => {
      if (!user) throw new Error('You must be logged to vote!')

      return vote(voteValue, postId, user?.id)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes', postId] })
    },
  })

  if (isLoading) {
    return <div>Loading votes...</div>
  }

  if (error) {
    return <div>Error:{error.message}</div>
  }

  const likes = votes?.filter((item) => item.vote === 1).length || 0
  const dislikes = votes?.filter((item) => item.vote === -1).length || 0

  const userVote = votes?.find((item) => item.user_id === user?.id)?.vote

  const ThumpsUp = '\u{1F44D}'
  const ThumpsDown = '\u{1F44E}'

  return (
    <div className="flex items-center space-x-4 my-4">
      <button
        type="button"
        onClick={() => mutate(1)}
        className={`px-3 py-1 cursor-pointer rounded transition-colors duration-150 
        ${userVote === 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-black'}`}
      >
        {ThumpsUp} {likes}
      </button>
      <button
        type="button"
        onClick={() => mutate(-1)}
        className={`px-3 py-1 cursor-pointer rounded transition-colors duration-150 
        ${userVote === -1 ? 'bg-red-500 text-white' : 'bg-gray-200 text-black'}`}
      >
        {ThumpsDown} {dislikes}
      </button>
    </div>
  )
}
