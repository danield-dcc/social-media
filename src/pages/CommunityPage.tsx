import { useParams } from 'react-router'
import { CommunityDisplay } from '../components/CommunitDisplay'

export function CommunityPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="pt-20">
      <CommunityDisplay communityId={Number(id)} />
    </div>
  )
}
