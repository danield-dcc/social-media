import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase-client'
import { PostItem } from './PostItem'
import type { Post } from './PostList'

interface CommunityDisplayProps {
  communityId: number
}

interface PostWithCommunity extends Post {
  communities: {
    name: string
  }
}

export const fetchCommunityPost = async (
  communityId: number
): Promise<PostWithCommunity[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select('*, communities(name)')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as PostWithCommunity[]
}

export function CommunityDisplay({ communityId }: CommunityDisplayProps) {
  const { data, error, isLoading } = useQuery<PostWithCommunity[], Error>({
    queryKey: ['communityPost', communityId],
    queryFn: () => fetchCommunityPost(communityId),
  })

  if (isLoading)
    return <div className="text-center py-4">Loading communities...</div>
  if (error)
    return (
      <div className="text-center text-red-500 py-4">
        Error: {error.message}
      </div>
    )

  if (!data?.length) {
    return <p>Error: Community cannot be found</p>
  }
  return (
    <div>
      <h2 className="text-6xl font-bold mb-6 text-center bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        {data[0].communities.name}
        Community Posts/
      </h2>
      {data && data.length > 0 ? (
        <div className="flex flex-wrap gap-6 justify-center">
          {data.map((post) => (
            <PostItem key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400">
          No post in the community yet.
        </p>
      )}
    </div>
  )
}
