import { Bell } from 'lucide-react'

// Placeholder notification bell — shows unread count when a notifications API exists.
export default function NotificationBell({ count = 0 }) {
  return (
    <button type="button" className="relative p-2 rounded-lg hover:bg-gray-100" aria-label="Notifications">
      <Bell size={20} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  )
}
