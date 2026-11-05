import CarSection from './CarSection'

// Kept so any old import still works
const NewArrivals = () => (
  <CarSection
    title="New Arrivals"
    subtitle="Japanese used cars just added to our stock"
    params={{ sort: 'newest' }}
    to="/cars?sort=newest"
    showEmpty
  />
)

export default NewArrivals