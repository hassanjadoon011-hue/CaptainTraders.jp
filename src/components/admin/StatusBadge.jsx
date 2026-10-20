export default function StatusBadge({ status }) {
  const styles = {
    New: "bg-green-100 text-green-600",
    Used: "bg-yellow-100 text-yellow-600",
    Reconditioned: "bg-blue-100 text-blue-600",
  };

  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${styles[status] || "bg-gray-100 text-gray-500"}`}>
      {status || "N/A"}
    </span>
  );
}