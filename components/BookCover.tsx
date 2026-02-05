import React, { useState, useEffect } from 'react';
import { Book as BookIcon } from 'lucide-react';
import { Book } from '../types';

interface BookCoverProps {
  book: Book;
  className?: string;
  showSpine?: boolean;
}

const COVER_CACHE_PREFIX = 'calibre_cover_v1_';

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
    
    // 2. Fetch from API with jitter to prevent rate limiting
    // Random delay between 100ms and 2000ms to stagger requests
    const delay = Math.floor(Math.random() * 2000) + 100;
    
    const timeout = setTimeout(async () => {
        if (!isMounted) return;
        
        try {
            // Heuristic: Use main title and first author for best match
            const cleanTitle = book.title.split(':')[0].split('(')[0].trim();
            const cleanAuthor = book.authors.split('&')[0].split(',')[0].trim();
            
            // Construct query
            const q = `intitle:${encodeURIComponent(cleanTitle)}+inauthor:${encodeURIComponent(cleanAuthor)}`;
            
            // Optimization: Only ask for imageLinks to reduce payload
            const res = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&fields=items(volumeInfo(imageLinks))`
            );
            
            if (!res.ok) throw new Error('Network response was not ok');
            
            const data = await res.json();
            
            if (isMounted) {
                const img = data.items?.[0]?.volumeInfo?.imageLinks;
                // Prefer thumbnail, fallback to smallThumbnail
                const url = img?.thumbnail || img?.smallThumbnail;
                
                if (url) {
                    // Force HTTPS
                    const secureUrl = url.replace('http:', 'https:');
                    setCoverUrl(secureUrl);
                    localStorage.setItem(cacheKey, secureUrl);
                } else {
                    // Cache the miss so we don't keep retrying
                    localStorage.setItem(cacheKey, '404');
                }
            }
        } catch (e) {
            // On error, we just leave it as null (placeholder)
            // We might choose to NOT cache errors to allow retries on reload
            console.debug(`Failed to fetch cover for ${book.title}`, e);
        } finally {
            if (isMounted) setLoading(false);
        }
    }, delay);

    return () => {
        isMounted = false;
        clearTimeout(timeout);
    };
  }, [book.id, book.title, book.authors]);

  if (coverUrl) {
    return (
      <div className={`relative overflow-hidden bg-stone-800 ${className}`}>
        <img 
            src={coverUrl} 
            alt={`Cover for ${book.title}`} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
        />
        {showSpine && (
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-r from-white/20 to-transparent pointer-events-none mix-blend-overlay"></div>
        )}
        {/* Subtle inner shadow for depth */}
        <div className="absolute inset-0 shadow-[inset_0_0_2px_rgba(0,0,0,0.5)] pointer-events-none"></div>
      </div>
    );
  }

  // Placeholder State
  return (
    <div className={`relative bg-stone-800 flex items-center justify-center overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
         <BookIcon className="w-1/3 h-1/3 text-stone-700 group-hover:text-amber-700 transition-colors opacity-50" />
      </div>
      {showSpine && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/5"></div>}
      
      {/* Title overlay if no cover (optional, but good for usability) */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-stone-950 to-transparent opacity-60"></div>
    </div>
  );
};