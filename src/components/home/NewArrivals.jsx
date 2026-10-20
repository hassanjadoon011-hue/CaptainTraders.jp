import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axiosClient from '../../api/axiosClient'
import CarCard from '../cars/CarCard'

const NewArrivals = () => {
  const [cars, setCars] = useState([])

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const res = await axiosClient.get('/cars', {
          params: { limit: 6, sort: 'newest', status: 'available' },
        })
        setCars(res?.data?.data || [])
      } catch (err) {
        console.log(err)
      }
    }
    fetchCars()
  }, [])

  if (cars.length === 0) return null

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#0A1628]">New Arrivals</h2>
        <Link to="/cars" className="text-blue-600 text-sm hover:underline">
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cars.map((car) => (
          <CarCard key={car._id} car={car} />
        ))}
      </div>
    </section>
  )
}

export default NewArrivals