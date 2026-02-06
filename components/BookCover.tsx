import React, { useState, useEffect } from 'react';
import { Book as BookIcon } from 'lucide-react';
import { Book } from '../types';
import { getBookColor } from '../utils/colors';

interface BookCoverProps {
  book: Book;
  className?: string;
  showSpine?: boolean;
}

const COVER_CACHE_PREFIX = 'calibre_cover_v2_';
const GOOGLE_API_KEY = 'AIzaSyAlpo9g1Xnqbp0sRT8fNzUxBV_5SG3DYWQ';

export const BookCover: React.FC<BookCoverProps> = ({ book, className = "", showSpine = true }) => {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check Local Cache
    const cacheKey = `${COVER_CACHE_PREFIX}${book.id}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached) {
        if (cached !== '404') setCoverUrl(cached);
        setLoading(false);
        return;
    }

    let isMounted = true;
    
    // Stagger requests to avoid slamming APIs immediately on mount
    const delay = Math.floor(Math.random() * 1000) + 100;
    
    const fetchCover = async () => {
        await new Promise(res => setTimeout(res, delay));
        if (!isMounted) return;

        try {
            // Heuristic cleaning
            const cleanTitle = book.title.split(':')[0].split('(')[0].trim();
            // Get first author, remove potential role format like "Name [Role]"
            const cleanAuthor = book.authors.split('&')[0].split(',')[0].replace(/\[.*?\]/g, '').trim();
            
            // --- Strategy 1: Open Library (No Key, Free) ---
            // Search API is required to map Title/Author to an Edition/Cover
            const olSearchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(cleanTitle)}&author=${encodeURIComponent(cleanAuthor)}&limit=1&fields=cover_i`;
            
            const olRes = await fetch(olSearchUrl);
            if (olRes.ok) {
                const olData = await olRes.json();
                const coverId = olData.docs?.[0]?.cover_i;
                if (coverId) {
                    const url = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
                    if (isMounted) {
                        setCoverUrl(url);
                        localStorage.setItem(cacheKey, url);
                        setLoading(false);
                        return;
                    }
                }
            }

            if (!isMounted) return;

            // --- Strategy 2: Google Books (Fallback, Key Required) ---
            // Intitle/Inauthor search
            const q = `intitle:${encodeURIComponent(cleanTitle)}+inauthor:${encodeURIComponent(cleanAuthor)}`;
            const gbRes = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&fields=items(volumeInfo(imageLinks))&key=${GOOGLE_API_KEY}`
            );
            
            if (gbRes.ok) {
                const gbData = await gbRes.json();
                const img = gbData.items?.[0]?.volumeInfo?.imageLinks;
                const url = img?.thumbnail || img?.smallThumbnail;
                
                if (url && isMounted) {
                    const secureUrl = url.replace('http:', 'https:');
                    setCoverUrl(secureUrl);
                    localStorage.setItem(cacheKey, secureUrl);
                    setLoading(false);
                    return;
                }
            }

            // --- Strategy 3: Not Found ---
            if (isMounted) {
                localStorage.setItem(cacheKey, '404');
                setLoading(false);
            }

        } catch (e) {
            console.warn(`Cover fetch failed for ${book.title}`, e);
            if (isMounted) setLoading(false);
        }
    };

    fetchCover();

    return () => {
        isMounted = false;
    };
  }, [book.id, book.title, book.authors]);

  const bgColor = getBookColor(book.title + book.authors);

  if (coverUrl) {
    return (
      <div className={`relative overflow-hidden bg-stone-800 ${className} group`}>
        <img 
            src={coverUrl} 
            alt={`Cover for ${book.title}`} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setCoverUrl(null)} // Fallback to procedural on image error
        />
        {showSpine && (
            <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 bg-gradient-to-r from-white/30 to-transparent pointer-events-none mix-blend-overlay z-10"></div>
        )}
        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] pointer-events-none transition-opacity duration-300"></div>
      </div>
    );
  }

  // Procedural Fallback Cover
  return (
    <div 
      className={`relative flex flex-col p-4 overflow-hidden ${className} group`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M5 0h1L0 6V5zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E")` }}
      ></div>
      
      {/* Spine Effect */}
      {showSpine && (
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-transparent to-transparent z-10"></div>
      )}
      
      {/* Vertical Lines/Decoration */}
      <div className="absolute top-0 left-4 right-4 h-full border-x border-white/10 pointer-events-none"></div>
      
      <div className="relative z-0 flex flex-col h-full justify-between text-center pt-2 pb-4">
        <div className="flex flex-col gap-2">
            <div className="w-full h-px bg-white/20 mx-auto"></div>
            <h3 className="font-serif font-bold text-stone-100 text-sm md:text-base leading-tight line-clamp-4 drop-shadow-md">
                {book.title}
            </h3>
            <div className="w-16 h-px bg-white/20 mx-auto mt-1"></div>
        </div>

        <div className="mt-auto">
            <div className="w-8 h-8 mx-auto mb-2 text-white/50">
                 <BookIcon strokeWidth={1} />
            </div>
            <p className="font-sans text-xs uppercase tracking-widest text-white/70 line-clamp-2 font-medium">
                {book.authors.split('&')[0].split(',')[0]}
            </p>
        </div>
      </div>

      {/* Hover lighting */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};
