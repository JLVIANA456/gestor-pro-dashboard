"use client";
import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import {
  IconArrowNarrowLeft,
  IconArrowNarrowRight,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";

interface CarouselProps {
  items: React.ReactNode[];
  initialScroll?: number;
}

type CardType = {
  src: string;
  title: string;
  category: string;
  content: React.ReactNode;
};

export const CarouselContext = createContext<{
  onCardClose: (index: number) => void;
  currentIndex: number;
}>({
  onCardClose: () => {},
  currentIndex: 0,
});

export const Carousel = ({ items, initialScroll = 0 }: CarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll]);

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = isMobile() ? 230 : 384; 
      const gap = isMobile() ? 4 : 8;
      const scrollPosition = (cardWidth + gap) * (index + 1);
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  };

  const isMobile = () => {
    return typeof window !== "undefined" && window.innerWidth < 768;
  };

  return (
    <CarouselContext.Provider
      value={{ onCardClose: handleCardClose, currentIndex }}
    >
      <div className="relative w-full">
        <div
          className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth py-6 [scrollbar-width:none] md:py-12"
          ref={carouselRef}
          onScroll={checkScrollability}
        >
          <div
            className={cn(
              "flex flex-row justify-start gap-10 pl-8",
              "mx-auto w-full", 
            )}
          >
            {items.map((item, index) => (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: 0.2 * index,
                    ease: "easeOut",
                  },
                }}
                key={"card" + index}
                className="rounded-3xl last:pr-[5%] md:last:pr-[33%]"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 mr-10 mt-4">
          <button
            className="relative z-40 h-12 w-12 rounded-full bg-white border border-border shadow-sm flex items-center justify-center disabled:opacity-50 hover:shadow-md transition-all active:scale-95"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
          >
            <IconArrowNarrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <button
            className="relative z-40 h-12 w-12 rounded-full bg-white border border-border shadow-sm flex items-center justify-center disabled:opacity-50 hover:shadow-md transition-all active:scale-95"
            onClick={scrollRight}
            disabled={!canScrollRight}
          >
            <IconArrowNarrowRight className="h-6 w-6 text-foreground" />
          </button>
        </div>
      </div>
    </CarouselContext.Provider>
  );
};

export const Card = ({
  card,
  index,
  layout = false,
}: {
  card: CardType;
  index: number;
  layout?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { onCardClose } = useContext(CarouselContext);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useOutsideClick(containerRef, () => handleClose());

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    onCardClose(index);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 h-screen overflow-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 h-full w-full bg-black/40 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              ref={containerRef}
              layoutId={layout ? `card-${card.title}` : undefined}
              className="relative z-[60] mx-auto my-14 min-h-[400px] max-w-5xl rounded-[2.5rem] bg-white overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-border"
            >
              {/* Header with Background Image Preview */}
              <div className="relative h-48 md:h-64 w-full overflow-hidden">
                <img 
                   src={card.src} 
                   className="w-full h-full object-cover" 
                   alt={card.title} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
                
                <button
                  className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 backdrop-blur-md border border-border transition-all hover:scale-110 active:scale-95 shadow-lg group/close"
                  onClick={handleClose}
                >
                  <IconX className="h-5 w-5 text-foreground group-hover:rotate-90 transition-transform duration-500" />
                </button>
              </div>

              <div className="relative z-10 -mt-16 p-8 md:px-14 md:pb-14">
                <motion.div
                  layoutId={layout ? `category-${card.title}` : undefined}
                  className="flex items-center gap-2 mb-3"
                >
                  <div className="h-1 w-8 bg-primary rounded-full" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-primary">
                    {card.category}
                  </span>
                </motion.div>
                
                <motion.h2
                  layoutId={layout ? `title-${card.title}` : undefined}
                  className="text-3xl md:text-5xl font-light text-foreground tracking-tight leading-tight"
                >
                  {card.title}
                </motion.h2>
                
                <div className="mt-10 w-full">{card.content}</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <motion.button
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={handleOpen}
        whileHover={{ 
          scale: 1.05, 
          transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } 
        }}
        whileTap={{ scale: 0.96 }}
        className="group relative z-10 flex h-72 w-56 flex-col items-start justify-start overflow-hidden rounded-[2.5rem] bg-white md:h-[28rem] md:w-[22rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-border"
      >
        <div className="pointer-events-none absolute inset-0 z-30 transition-all duration-500 bg-gradient-to-b from-black/40 via-transparent to-black/80 group-hover:from-black/50 group-hover:to-primary/20" />
        
        <div className="relative z-40 p-8 md:p-14 w-full h-full flex flex-col justify-between">
          <div className="space-y-4">
            <motion.div
              layoutId={layout ? `category-${card.category}` : undefined}
              className="flex items-center gap-2"
            >
              <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(235,36,36,0.8)]" />
              <span className="text-left font-sans text-[10px] font-medium uppercase tracking-[0.4em] text-white/90">
                {card.category}
              </span>
            </motion.div>
            <motion.p
              layoutId={layout ? `title-${card.title}` : undefined}
              className="mt-4 max-w-xs text-left font-sans text-3xl font-light [text-wrap:balance] text-white md:text-5xl tracking-tighter leading-[0.85] group-hover:translate-x-2 transition-transform duration-700"
            >
              {card.title}
            </motion.p>
          </div>

          <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-6 group-hover:translate-y-0">
             <div className="flex items-center gap-2 bg-white/20 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/30 shadow-2xl">
                <span className="text-[10px] font-black text-white uppercase tracking-widest ">Ver Detalhes</span>
             </div>
             <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center shadow-2xl transition-transform group-hover:rotate-45 duration-700">
                <IconX className="h-6 w-6 text-primary rotate-45" />
             </div>
          </div>
        </div>
        
        <BlurImage
          src={card.src}
          alt={card.title}
          className="absolute inset-0 z-10 object-cover h-full w-full transition-all duration-1000 scale-[1.1] group-hover:scale-[1.25] group-hover:rotate-1 brightness-[0.85] group-hover:brightness-[1]"
        />
      </motion.button>
    </>
  );
};

export const BlurImage = ({
  src,
  className,
  alt,
  ...rest
}: {
  src: string;
  className?: string;
  alt?: string;
  [key: string]: any;
}) => {
  const [isLoading, setLoading] = useState(true);
  return (
    <img
      className={cn(
        "transition duration-300",
        isLoading ? "blur-sm" : "blur-0",
        className
      )}
      onLoad={() => setLoading(false)}
      src={src}
      loading="lazy"
      decoding="async"
      alt={alt ? alt : "Background view"}
      {...rest}
    />
  );
};
