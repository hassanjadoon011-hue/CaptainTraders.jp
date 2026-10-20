import { useNotification } from '../../context/NotificationContext'

export default function NotificationContainer() {
  const { notifications } = useNotification()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className={`px-4 py-3 rounded-lg text-white shadow-lg animate-pulse ${
            notif.type === 'success'
              ? 'bg-green-500'
              : notif.type === 'error'
              ? 'bg-red-500'
              : 'bg-blue-500'
          }`}
        >
          {notif.message}
        </div>
      ))}
    </div>
  )
}