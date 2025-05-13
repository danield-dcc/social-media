import { useMutation, useQuery } from '@tanstack/react-query'
import { type ChangeEvent, type FormEvent, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase-client'
import { type Community, fetchCommunities } from './CommunityList'

interface PostInput {
  title: string
  content: string
  avatar_url: string | null
  community_id?: number | null
}

async function createPost(post: PostInput, imageFile: File) {
  const generatedFilePath = `${post.title}-${Date.now()}-${imageFile.name}`

  const { error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(generatedFilePath, imageFile)

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data: publicUrlData } = supabase.storage
    .from('post-images')
    .getPublicUrl(generatedFilePath)

  const { data, error } = await supabase
    .from('posts')
    .insert({ ...post, image_url: publicUrlData.publicUrl })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export function CreatePost() {
  const [title, setTitle] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [communityId, setCommunityId] = useState<number | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { user } = useAuth()

  const { data: communitiesData } = useQuery<Community[], Error>({
    queryKey: ['communities'],
    queryFn: fetchCommunities,
  })
  const { mutate, isPending, isError } = useMutation({
    mutationFn: (data: { post: PostInput; imageFile: File }) => {
      return createPost(data.post, data.imageFile)
    },
  })

  function handleSubmit(data: FormEvent) {
    data.preventDefault()
    if (!selectedFile) return

    mutate({
      post: {
        title,
        content,
        avatar_url: user?.user_metadata.avatar_url || null,
        community_id: communityId,
      },
      imageFile: selectedFile,
    })

    setTitle('')
    setContent('')
    setSelectedFile(null)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files?.[0])
    }
  }

  const handleCommunityChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setCommunityId(value ? Number(value) : null)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
      <div>
        <label htmlFor="title" className="block mb-2 font-medium">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          required
          onChange={(event) => setTitle(event?.target.value)}
          className="w-full border border-white/10 bg-transparent p-2 rounded"
        />
      </div>
      <div>
        <label htmlFor="title" className="block mb-2 font-medium">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          required
          rows={5}
          onChange={(event) => setContent(event?.target.value)}
          className="w-full border border-white/10 bg-transparent p-2 rounded"
        />
      </div>

      <div>
        <label htmlFor="community"> Select Community</label>
        <select id="community" onChange={handleCommunityChange}>
          <option value={''}> -- Choose a Community -- </option>
          {communitiesData?.map((community) => (
            <option key={community.id} value={community.id}>
              {community.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="image" className="block mb-2 font-medium">
          Upload Image
        </label>
        <input
          id="image"
          accept="image/*"
          required
          type="file"
          onChange={handleFileChange}
          className="w-full text-gray-200"
        />
      </div>
      <button
        type="submit"
        className="bg-purple-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-purple-700"
        disabled={isPending}
      >
        {isPending ? <p>Creating...</p> : <p>Create Post</p>}
      </button>
      {isError && <p className="text-red-500">Error Creating Post</p>}
    </form>
  )
}
