import Breadcrumb from './Breadcrumb'

// Shared maroon banner (breadcrumb bar) used across pages.
export default function PageBanner({ breadcrumbItems = [] }) {
  return <Breadcrumb items={breadcrumbItems} />
}
