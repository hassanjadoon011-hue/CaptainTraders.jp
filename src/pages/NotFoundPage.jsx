import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 bg-[#F5F9FF]">
      <p className="text-6xl font-extrabold text-[#29ABE2]">404</p>
      <h1 className="text-2xl font-bold text-gray-800 mt-4">Page not found</h1>
      <p className="text-gray-500 mt-2">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex items-center gap-3 mt-6">
        <Link
          to="/"
          className="bg-[#29ABE2] hover:bg-[#1B7DB3] text-white font-semibold px-6 py-2.5 rounded-lg transition"
        >
          Go Home
        </Link>
        <Link
          to="/cars"
          className="bg-white border border-[#29ABE2] text-[#1B7DB3] font-semibold px-6 py-2.5 rounded-lg transition hover:bg-blue-50"
        >
          Browse Cars
        </Link>
      </div>
    </div>
  )
}