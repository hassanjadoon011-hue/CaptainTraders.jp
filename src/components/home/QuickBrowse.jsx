import { Link } from 'react-router-dom'

const GROUPS = [
  {
    title: 'By Price',
    items: [
      { label: 'Under $3,000', to: '/cars?priceTo=3000' },
      { label: '$3,000 – $6,000', to: '/cars?priceFrom=3000&priceTo=6000' },
      { label: '$6,000 – $10,000', to: '/cars?priceFrom=6000&priceTo=10000' },
      { label: 'Over $10,000', to: '/cars?priceFrom=10000' },
    ],
  },
  {
    title: 'By Year',
    items: [
      { label: '2020 and newer', to: '/cars?yearFrom=2020' },
      { label: '2015 – 2019', to: '/cars?yearFrom=2015&yearTo=2019' },
      { label: '2010 – 2014', to: '/cars?yearFrom=2010&yearTo=2014' },
      { label: '2009 and older', to: '/cars?yearTo=2009' },
    ],
  },
  {
    title: 'Other Categories',
    items: [
      { label: 'Left Hand Drive', to: '/cars?steering=left' },
      { label: 'Diesel', to: '/cars?fuel=diesel' },
      { label: 'Manual', to: '/cars?transmission=manual' },
    ],
  },
]

export default function QuickBrowse() {
  return (
    <section className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <h3 className="text-sm font-bold text-gray-900 mb-3">{g.title}</h3>
            <div className="flex flex-wrap gap-2">
              {g.items.map((i) => (
                <Link
                  key={i.label}
                  to={i.to}
                  className="text-[13px] font-medium text-gray-600 bg-gray-50 hover:bg-[#E0F5FF] hover:text-[#1B7DB3] px-3 py-2 rounded-full transition"
                >
                  {i.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}