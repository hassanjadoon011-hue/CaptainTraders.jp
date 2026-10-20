export const menuData = [
  {
    label: 'Stock',
    hasMega: true,
    columns: [
      {
        heading: 'Browse by Type',
        links: [
          { label: 'Sedans',     href: '/cars?bodyType=Sedan' },
          { label: 'SUVs',       href: '/cars?bodyType=SUV' },
          { label: 'Hatchbacks', href: '/cars?bodyType=Hatchback' },
          { label: 'Coupes',     href: '/cars?bodyType=Coupe' },
          { label: 'Vans',       href: '/cars?bodyType=Van' },
          { label: 'Trucks',     href: '/cars?bodyType=Truck' },
        ],
      },
      {
        heading: 'Top Makes',
        links: [
          { label: 'Toyota', href: '/cars?make=Toyota' },
          { label: 'Honda',  href: '/cars?make=Honda' },
          { label: 'Nissan', href: '/cars?make=Nissan' },
          { label: 'Mazda',  href: '/cars?make=Mazda' },
          { label: 'Subaru', href: '/cars?make=Subaru' },
        ],
      },
    ],
  },
  { label: 'Inventory', hasMega: false, href: '/cars' },
  {
    label: 'Buy',
    hasMega: true,
    columns: [
      {
        heading: 'Buying Process',
        links: [
          { label: 'How to Buy',         href: '/how-to-buy' },
          { label: 'Payment & Shipping', href: '/purchasing' },
        ],
      },
    ],
  },
  {
    label: 'FAQ',
    hasMega: true,
    columns: [
      {
        heading: 'Help Center',
        links: [
          { label: 'All Questions', href: '/faq' },
          { label: 'Contact Us',    href: '/contact' },
        ],
      },
    ],
  },
  { label: 'About',   hasMega: false, href: '/about' },
  { label: 'Contact', hasMega: false, href: '/contact' },
]