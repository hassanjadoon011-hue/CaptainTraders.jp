import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, ImageOff } from "lucide-react";

export default function ImageGallery({ images = [], alt = "Vehicle", sold = false }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const count = images.length;

  const go = useCallback(
    (dir) => setIndex((i) => (count ? (i + dir + count) % count : 0)),
    [count]
  );

  // Back to the first photo when another car is shown
  useEffect(() => {
    setIndex(0);
  }, [images[0]]);

  // Keyboard controls and page lock while the full-screen view is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, go]);

  if (count === 0) {
    return (
      <div className="aspect-[4/3] bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400">
        <ImageOff size={36} />
        <p className="text-sm mt-2">No photos available</p>
      </div>
    );
  }

  const arrow =
    "absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-gray-700 transition";

  return (
    <div>
      <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden group">
        <img
          src={images[index]}
          alt={`${alt} - photo ${index + 1}`}
          onClick={() => setOpen(true)}
          className="w-full h-full object-cover cursor-zoom-in"
        />

        {sold && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
            <span className="bg-red-600 text-white font-bold tracking-widest px-6 py-2 rounded-lg text-lg rotate-[-8deg]">
              SOLD
            </span>
          </div>
        )}

        {count > 1 && (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className={`${arrow} left-3`}>
              <ChevronLeft size={20} />
            </button>
            <button type="button" aria-label="Next photo" onClick={() => go(1)} className={`${arrow} right-3`}>
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <button
          type="button"
          aria-label="View full screen"
          onClick={() => setOpen(true)}
          className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition"
        >
          <Maximize2 size={16} />
        </button>

        <span className="absolute bottom-3 left-3 text-xs bg-black/60 text-white px-2.5 py-1 rounded-full">
          {index + 1} / {count}
        </span>
      </div>

      {count > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition ${
                i === index ? "border-[#29ABE2]" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X size={20} />
          </button>

          <img
            src={images[index]}
            alt={`${alt} - photo ${index + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-full object-contain rounded-lg"
          />

          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                className={`${arrow} left-4`}
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={(e) => { e.stopPropagation(); go(1); }}
                className={`${arrow} right-4`}
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}