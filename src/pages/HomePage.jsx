import { useNavigate } from 'react-router-dom'
import Hero from '../components/home/Hero/Hero'
import LeftSidebar from '../components/sidebar/LeftSidebar'
import SearchPanel from '../components/home/SearchPanel'
import CarSection from '../components/home/CarSection'
import TrustStrip from '../components/home/TrustStrip'

export default function HomePage() {
  const navigate = useNavigate()

  const handleMakeSelect = (make) => {
    navigate(`/cars?make=${encodeURIComponent(make)}`)
  }

  return (
    <div className="bg-[#F5F9FF] min-h-screen overflow-x-hidden">
      <Hero />
      <SearchPanel />

      {/* Stacks on phones/tablets (make chips on top), side by side on laptops */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row gap-4 lg:gap-6 mt-6 sm:mt-10 pb-10">
        <LeftSidebar onMakeSelect={handleMakeSelect} />

        <div className="flex-1 space-y-10 sm:space-y-12 min-w-0">
          <CarSection
            title="New Arrivals"
            subtitle="Japanese used cars just added to our stock"
            params={{ sort: 'newest' }}
            to="/cars?sort=newest"
            showEmpty
          />

          <CarSection
            title="Recommended"
            subtitle="Cars picked by our team"
            params={{ recommend: '1' }}
            to="/cars?recommend=1"
          />

          <CarSection
            title="Best Deals"
            subtitle="Great value for money"
            params={{ bestDeals: '1' }}
            to="/cars?bestDeals=1"
          />

          <TrustStrip />
        </div>
      </div>
    </div>
  )
}