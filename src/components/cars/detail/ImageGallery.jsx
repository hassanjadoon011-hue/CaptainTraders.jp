import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, ImageOff } from "lucide-react";

// Swipe: a horizontal move of at least 40px changes the photo
function useSwipe(onLeft, onRight) {
  const start = useRef(null);
  return {
    onTouchStart: (e) => { start.current = e.touches[0].clientX; },
    onTouchEnd: (e) => {
      if (start.current == null) return;
      const dx = e.changedTouches[0].clientX - start.current;
      start.current = null;
      if (dx <= -40) onLeft();
      if (dx >= 40) onRight();
    },
  };
}

// Image that shows a neutral placeholder if the file fails to load
function Photo({ src, alt, className, loading, onClick }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (broken || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 ${className}`} onClick={onClick}>
        <ImageOff size={28} aria-hidden="true" />
        <span className="sr-only">{alt} (image unavailable)</span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading={loading} decoding="async" onError={() => setBroken(true)} onClick={onClick} className={className} />;
}

export default function ImageGallery({ images = [], alt = "Vehicle", sold = false }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const thumbs = useRef(null);
  const count = images.length;

  const go = useCallback((dir) => setIndex((i) => (count ? (i + dir + count) % count : 0)), [count]);
  const swipe = useSwipe(() => go(1), () => go(-1));

  // Back to the first photo when another car is shown
  useEffect(() => setIndex(0), [images[0]]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the active thumbnail in view
  useEffect(() => {
    thumbs.current?.children[index]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [index]);

  // Lightbox: keyboard + lock page scroll
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

  const frame = "relative aspect-[4/3] lg:aspect-[16/10] rounded-xl overflow-hidden bg-gray-100";

  if (count === 0) {
    return (
      <div className={`${frame} flex flex-col items-center justify-center text-gray-400`}>
        <ImageOff size={36} aria-hidden="true" />
        <p className="text-sm mt-2">No photos available</p>
        {sold && <SoldRibbon />}
      </div>
    );
  }

  const arrow =
    "absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center text-gray-700 transition";

  return (
    <div>
      {/* MAIN PHOTO (fixed ratio = no layout shift while loading) */}
      <div
        className={`${frame} group outline-none focus-visible:ring-2 focus-visible:ring-[#29ABE2]`}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${alt} photos`}
        onKeyDown={(e) => {
          if (open) return; // the lightbox handles keys while it is open
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "Enter") setOpen(true);
        }}
        {...swipe}
      >
        <Photo
          key={images[index]}
          src={images[index]}
          alt={`${alt} - photo ${index + 1} of ${count}`}
          onClick={() => setOpen(true)}
          className="w-full h-full object-cover cursor-zoom-in"
        />

        {sold && <SoldRibbon />}

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
          className="absolute top-3 right-3 w-11 h-11 rounded-lg bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition"
        >
          <Maximize2 size={18} />
        </button>

        <span className="absolute bottom-3 left-3 text-xs font-medium bg-black/60 text-white px-2.5 py-1 rounded-full tabular-nums">
          {index + 1} / {count}
        </span>
      </div>

      {/* THUMBNAILS (scroll sideways on phones) */}
      {count > 1 && (
        <div ref={thumbs} className="flex gap-2 mt-3 overflow-x-auto pb-1 snap-x" role="tablist" aria-label="Choose a photo">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`relative shrink-0 snap-start w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden bg-gray-100 transition ${
                i === index ? "ring-2 ring-[#29ABE2] ring-offset-2 ring-offset-white" : "opacity-60 hover:opacity-100"
              }`}
            >
              <Photo src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* LIGHTBOX */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} photos, full screen`}
          onClick={() => setOpen(false)}
          {...swipe}
        >
          <span className="absolute top-5 left-5 text-sm font-medium text-white/90 tabular-nums">
            {index + 1} / {count}
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X size={22} />
          </button>

          <Photo
            key={`lb-${images[index]}`}
            src={images[index]}
            alt={`${alt} - photo ${index + 1} of ${count}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full object-contain rounded-lg"
          />

          {count > 1 && (
            <>
              <button type="button" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); go(-1); }} className={`${arrow} left-3 sm:left-5`}>
                <ChevronLeft size={22} />
              </button>
              <button type="button" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); go(1); }} className={`${arrow} right-3 sm:right-5`}>
                <ChevronRight size={22} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SoldRibbon() {
  return (
    <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden pointer-events-none" aria-label="Sold">
      <span className="absolute top-6 -left-9 w-44 rotate-[-45deg] bg-red-600 text-white text-center text-sm font-bold tracking-widest py-1.5 shadow">
        SOLD
      </span>
    </div>
  );
}
