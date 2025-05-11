import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase-client'
import { PostItem } from './PostItem'

export interface Post {
  id: number
  title: string
  content: string
  created_at: string
  image_url: string
  avatar_url?: string
}

async function fetchPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as Post[]
}

export function PostList() {
  const { data, error, isLoading } = useQuery<Post[], Error>({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  if (isLoading) {
    return <div>Loading posts...</div>
  }

  if (error) {
    return <div>Error:{error.message}</div>
  }

  console.log(data)
  return (
    <div className="flex flex-wrap gap-6 justify-center">
      {data?.map((post) => (
        <PostItem post={post} key={post.id} />
      ))}
    </div>
  )
}
