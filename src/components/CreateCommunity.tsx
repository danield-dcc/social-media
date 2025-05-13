import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '../supabase-client'

interface CommunityInput {
  name: string
  description: string
}

async function createCommunity(community: CommunityInput) {
  const { error, data } = await supabase.from('communities').insert(community)

  if (error) throw new Error(error.message)
  return data
}

export function CreateCommunity() {
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const queryClient = useQueryClient()

  const navigate = useNavigate()

  const { mutate, isPending, isError } = useMutation({
    mutationFn: createCommunity,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['communities'],
      })
      navigate('/communities')
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    mutate({ name, description })
  }
  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-6xl font-bold mb-6 text-center bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
        Create New Community
      </h2>
      <div>
        <label htmlFor="name" className="block mb-2 font-medium">
          Community Name
        </label>
        <input
          className="w-full border border-white/10 bg-transparent p-2 rounded"
          type="text"
          id="name"
          required
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <textarea
          className="w-full border border-white/10 bg-transparent p-2 rounded"
          id="description"
          rows={3}
          required
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="bg-purple-500 text-white px-4 py-2 rounded cursor-pointer"
      >
        {isPending ? 'Creating...' : 'Create Community'}
      </button>
      {isError && (
        <p className="text-red-500 font-semibold">Error creating community</p>
      )}
    </form>
  )
}
