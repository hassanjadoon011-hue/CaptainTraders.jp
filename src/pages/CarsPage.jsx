import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

const CarsPage = () => {
  const [cars, setCars] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchCars = async (currentPage) => {
    try {
      setLoading(true);

      const res = await axiosClient.get(
        `/cars?page=${currentPage}&limit=${limit}`
      );

      setCars(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.log("Error loading cars:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars(page);
  }, [page]);

  const nextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  return (
    <div>
      <h2>Cars List</h2>

      {/* LOADING STATE */}
      {loading && <p>Loading cars...</p>}

      {/* CAR LIST */}
      <div style={{ display: "grid", gap: "10px" }}>
        {cars.map((car) => (
          <div key={car._id} style={{ border: "1px solid #ddd", padding: 10 }}>
            <h3>{car.make} {car.model}</h3>
            <p>Year: {car.year}</p>
            <p>Price: {car.price}</p>
          </div>
        ))}
      </div>

      {/* PAGINATION CONTROLS */}
      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button onClick={prevPage} disabled={page === 1}>
          Previous
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button onClick={nextPage} disabled={page === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default CarsPage;