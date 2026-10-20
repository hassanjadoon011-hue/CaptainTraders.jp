import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import axiosClient from "../api/axiosClient"

// "1000" -> "1000 cc", "2.0L" stays as is
const formatEngine = (engine) => {
  if (!engine) return null
  const value = String(engine).trim()
  return /^\d+$/.test(value) ? `${value} cc` : value
}

export default function CarDetailPage() {
  const { id } = useParams()

  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    const fetchCar = async () => {
      try {
        setLoading(true)

        const res = await axiosClient.get(`/cars/${id}`)

        setCar(res.data?.data || null)
        setActiveImg(0)
        window.scrollTo(0, 0)
      } catch (err) {
        console.error(err)
        setCar(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCar()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    )
  }

  if (!car) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p>Car not found</p>
        <Link to="/cars" className="text-blue-500 mt-2">
          Back to Inventory
        </Link>
      </div>
    )
  }

  const isSold = car.status === "sold"

  const images =
    car.images?.length > 0
      ? car.images
      : ["https://via.placeholder.com/800x500?text=No+Image"]

  const specs = [
    { label: "Make", value: car.make },
    { label: "Model", value: car.model },
    { label: "Year", value: car.year },
    {
      label: "Price",
      value: car.price ? `USD ${Number(car.price).toLocaleString()}` : null,
    },
    {
      label: "Mileage",
      value: car.mileage ? `${Number(car.mileage).toLocaleString()} km` : null,
    },
    { label: "Fuel Type", value: car.fuelType },
    { label: "Engine", value: formatEngine(car.engine) },
    { label: "Power", value: car.power ? `${car.power} HP` : null },
    { label: "Transmission", value: car.transmission },
    { label: "Drivetrain", value: car.drivetrain },
    { label: "Body Type", value: car.bodyType },
    { label: "Color", value: car.color },
    { label: "Condition", value: car.condition },
    { label: "Location", value: car.location },
    { label: "VIN", value: car.vin },
  ].filter((item) => item.value)

  return (
    <div className="bg-[#F5F9FF] min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
        {/* LEFT SIDE */}
        <div className="md:col-span-2 space-y-6">
          {/* MAIN IMAGE */}
          <div className="relative bg-white border rounded-xl overflow-hidden">
            <img
              src={images[activeImg]}
              alt={`${car.make} ${car.model}`}
              className={`w-full h-[450px] object-cover ${isSold ? "opacity-80" : ""}`}
            />
            {isSold && (
              <span className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                Sold
              </span>
            )}
          </div>

          {/* THUMBNAILS */}
          {images.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  onClick={() => setActiveImg(index)}
                  className={`h-20 w-24 object-cover cursor-pointer rounded border-2 ${
                    index === activeImg ? "border-blue-500" : "border-gray-200"
                  }`}
                />
              ))}
            </div>
          )}

          {/* DESCRIPTION */}
          {car.description && (
            <div className="bg-white border rounded-xl p-5">
              <h2 className="font-bold mb-3 text-lg">Description</h2>
              <p className="text-gray-600 whitespace-pre-line">{car.description}</p>
            </div>
          )}

          {/* SPECIFICATIONS */}
          <div className="bg-white border rounded-xl p-5">
            <h2 className="font-bold mb-4 text-lg">Specifications</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {specs.map((spec) => (
                <div key={spec.label}>
                  <span className="font-semibold">{spec.label}:</span>{" "}
                  {spec.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div>
          <div className="bg-white border rounded-xl p-5 sticky top-5">
            <h1 className="text-2xl font-bold">
              {car.make} {car.model} {car.year}
            </h1>

            <p className="text-3xl font-bold text-blue-600 mt-4">
              USD {Number(car.price || 0).toLocaleString()}
            </p>

            <p className="text-xs text-gray-400 mt-2">
              All information provided by seller
            </p>

            {isSold ? (
              <div className="mt-5">
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  This vehicle has been sold.
                </div>
                <Link
                  to="/cars"
                  className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg mt-3 transition"
                >
                  Browse Available Cars
                </Link>
              </div>
            ) : (
              <Link
                to="/contact"
                className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg mt-5 transition"
              >
                Contact Seller
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}