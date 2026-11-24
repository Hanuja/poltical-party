import { Navigate, useParams } from 'react-router-dom'
import { getPolicyCategory } from '../data/policies'

// Legacy policy detail URLs now resolve against the frontend-owned category
// list. This keeps policy navigation independent of the admin/API endpoints.
export default function PolicyDetails() {
  const { slug } = useParams()
  const category = getPolicyCategory(slug)
  return <Navigate to={category ? `/policies?category=${category.slug}` : '/policies'} replace />
}
