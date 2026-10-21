import { useState } from "react";

const carMakes = [
  { name: "Toyota", logo: "https://www.carlogos.org/car-logos/toyota-logo.png" },
  { name: "Honda", logo: "https://www.carlogos.org/car-logos/honda-logo.png" },
  { name: "Nissan", logo: "https://www.carlogos.org/car-logos/nissan-logo.png" },
  { name: "Mazda", logo: "https://www.carlogos.org/car-logos/mazda-logo.png" },
  { name: "Mitsubishi", logo: "https://www.carlogos.org/car-logos/mitsubishi-logo.png" },
  { name: "Subaru", logo: "https://www.carlogos.org/car-logos/subaru-logo.png" },
  { name: "Suzuki", logo: "https://www.carlogos.org/car-logos/suzuki-logo.png" },
  { name: "Lexus", logo: "https://www.carlogos.org/car-logos/lexus-logo.png" },
  { name: "Daihatsu", logo: "https://www.carlogos.org/car-logos/daihatsu-logo.png" },
  { name: "Isuzu", logo: "https://www.carlogos.org/car-logos/isuzu-logo.png" },
];

export default function LeftSidebar({ onMakeSelect }) {
  const [selected, setSelected] = useState(null);

  const handleClick = (name) => {
    setSelected(name);
    onMakeSelect?.(name);
  };

  return (
    <>
      {/* PHONES & TABLETS: swipeable row of makes */}
      <div className="lg:hidden min-w-0">
        <p className="text-sm font-bold text-gray-900 mb-2">Search by Make</p>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {carMakes.map((car) => (
            <button
              key={car.name}
              onClick={() => handleClick(car.name)}
              className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium transition
                ${
                  selected === car.name
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
            >
              <img
                src={car.logo}
                alt=""
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              {car.name}
            </button>
          ))}
        </div>
      </div>

      {/* LAPTOPS & LARGER: side panel */}
      <aside className="hidden lg:block w-56 xl:w-60 shrink-0 self-start bg-white border rounded-xl overflow-hidden">
        <div className="bg-black text-white px-4 py-3 text-sm font-bold">
          Search by Make
        </div>

        <div className="divide-y">
          {carMakes.map((car) => (
            <button
              key={car.name}
              onClick={() => handleClick(car.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition
                ${selected === car.name ? "bg-blue-600 text-white" : "hover:bg-gray-50"}
              `}
            >
              <img
                src={car.logo}
                alt=""
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
              {car.name}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}