import React, { useState, useMemo, useEffect } from 'react';
import { Book } from '../types';
import { Search, Filter, Book as BookIcon, ChevronLeft, ChevronRight, X, ArrowUpDown, SlidersHorizontal, Check, Info, Plus } from 'lucide-react';
import { BookCover } from './BookCover';
import { advancedSearch } from '../utils/search';
import { getTagColor } from '../utils/colors';

interface BookBrowserProps {
  books: Book[];
  initialSearch?: string;
}

const ITEMS_PER_PAGE = 24;
type SortOption = 'date-newest' | 'date-oldest' | 'title-asc' | 'author-asc';

export const BookBrowser: React.FC<BookBrowserProps> = ({ books, initialSearch = '' }) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagLogic, setTagLogic] = useState<'AND' | 'OR'>('AND');
  const [sortBy, setSortBy] = useState<SortOption>('date-newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  
  // Tag Search state
  const [tagSearch, setTagSearch] = useState('');

  // Update search query when initialSearch prop changes
  useEffect(() => {
    if (initialSearch) {
        setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  // Extract Metadata efficiently
  const { formats, sortedTags } = useMemo(() => {
    const formatSet = new Set<string>();
    const tagCounts: Record<string, number> = {};

    books.forEach(b => {
        b.formats.forEach(f => formatSet.add(f.trim().toLowerCase()));
        b.tags.forEach(t => {
            const clean = t.trim();
            if (clean) tagCounts[clean] = (tagCounts[clean] || 0) + 1;
        });
    });

    return {
        formats: Array.from(formatSet).sort(),
        sortedTags: Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1]) // Sort by frequency
            .map(([name, count]) => ({ name, count }))
    };
  }, [books]);

  // Filter & Sort Logic
  const processedBooks = useMemo(() => {
    // 1. Boolean Search String
    let filtered = books;
    if (searchQuery.trim()) {
        filtered = filtered.filter(book => advancedSearch(book, searchQuery));
    }

    // 2. Format Filter
    if (selectedFormat !== 'all') {
        filtered = filtered.filter(book => book.formats.some(f => f.toLowerCase() === selectedFormat));
    }

    // 3. Tag Combination Filter
    if (selectedTags.length > 0) {
        filtered = filtered.filter(book => {
            // Trim book tags to ensure matching works against selected (trimmed) tags
            // This handles cases where JSON data has trailing/leading whitespace (e.g., " mobi" or " scifi ")
            if (tagLogic === 'AND') {
                // Must have ALL selected tags
                return selectedTags.every(selectedTag => 
                    book.tags.some(bookTag => bookTag.trim() === selectedTag)
                );
            } else {
                // Must have AT LEAST ONE selected tag
                return selectedTags.some(selectedTag => 
                    book.tags.some(bookTag => bookTag.trim() === selectedTag)
                );
            }
        });
    }

    // 4. Sort
    return filtered.sort((a, b) => {
        switch (sortBy) {
            case 'date-newest':
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            case 'date-oldest':
                return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            case 'title-asc':
                return (a.title_sort || a.title).localeCompare(b.title_sort || b.title);
            case 'author-asc':
                return (a.author_sort || a.authors).localeCompare(b.author_sort || b.authors);
            default:
                return 0;
        }
    });
  }, [books, searchQuery, selectedFormat, selectedTags, tagLogic, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedBooks.length / ITEMS_PER_PAGE);
  const paginatedBooks = processedBooks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFormat, selectedTags, sortBy]);

  // Toggle a tag selection
  const toggleTag = (tag: string) => {
      setSelectedTags(prev => 
          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      );
  };

  return (
    <div className="h-full flex flex-col bg-stone-950">
      {/* Top Bar: Search & View Controls */}
      <div className="p-4 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 flex flex-col xl:flex-row gap-4 items-center justify-between sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-3 w-full xl:w-auto flex-1">
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2.5 rounded-lg border transition-all ${showFilters ? 'bg-amber-900/30 border-amber-800 text-amber-500' : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'}`}
                title="Toggle Filters Sidebar"
            >
                <SlidersHorizontal className="w-5 h-5" />
            </button>

            <div className="relative w-full max-w-2xl group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 w-5 h-5 group-focus-within:text-amber-500 transition-colors" />
                <input
                    type="text"
                    placeholder='Search... (e.g., author:Asimov AND "Foundation" -tag:fantasy)'
                    className="w-full bg-stone-950 border border-stone-800 text-stone-200 rounded-lg pl-10 pr-10 py-2.5 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder-stone-600 font-mono text-sm shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 group/tooltip">
                    <Info className="w-4 h-4 text-stone-600 hover:text-stone-400 cursor-help" />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-stone-900 border border-stone-700 p-4 rounded-lg shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 text-xs text-stone-300">
                        <h4 className="font-bold text-amber-500 mb-2">Advanced Search Syntax</h4>
                        <ul className="space-y-1 font-mono">
                            <li><span className="text-stone-500">term</span> : Matches anywhere</li>
                            <li><span className="text-stone-500">"exact phrase"</span> : Exact match</li>
                            <li><span className="text-stone-500">author:name</span> : Specific field</li>
                            <li><span className="text-stone-500">tag:scifi</span> : Filter by tag</li>
                            <li><span className="text-stone-500">AND, OR</span> : Boolean logic</li>
                            <li><span className="text-stone-500">-term</span> : Exclude (NOT)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
          <div className="flex items-center gap-2 bg-stone-950 border border-stone-800 rounded-lg px-3 py-2">
            <ArrowUpDown className="w-4 h-4 text-stone-500" />
            <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-stone-300 text-sm focus:outline-none cursor-pointer hover:text-amber-500 transition-colors"
            >
                <option value="date-newest">Date Added (Newest)</option>
                <option value="date-oldest">Date Added (Oldest)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="author-asc">Author (A-Z)</option>
            </select>
          </div>
          <div className="text-stone-500 text-sm whitespace-nowrap px-2 font-mono border-l border-stone-800 ml-2">
            <span className="text-stone-200 font-bold">{processedBooks.length}</span> results
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Filter Sidebar */}
        <aside className={`
            bg-stone-900 border-r border-stone-800 flex flex-col transition-all duration-300 ease-in-out z-10
            ${showFilters ? 'w-80 translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}
        `}>
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
                <span className="font-serif font-bold text-stone-300">Filters</span>
                {(selectedTags.length > 0 || selectedFormat !== 'all' || searchQuery) && (
                     <button 
                        onClick={() => {
                            setSelectedTags([]);
                            setSelectedFormat('all');
                            setSearchQuery('');
                        }}
                        className="text-xs text-red-400 hover:text-red-300 underline"
                     >
                        Clear All
                     </button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                
                {/* Active Filter Chips */}
                {selectedTags.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Active Tags</h3>
                            <button 
                                onClick={() => setTagLogic(tagLogic === 'AND' ? 'OR' : 'AND')}
                                className="text-[10px] px-2 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-200 uppercase font-bold"
                            >
                                {tagLogic} Logic
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedTags.map(tag => {
                                const colors = getTagColor(tag);
                                return (
                                    <span key={tag} className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs border ${colors.bg} ${colors.text} ${colors.border}`}>
                                        {tag}
                                        <button onClick={() => toggleTag(tag)} className="hover:text-white">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Formats */}
                <div>
                    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Formats</h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedFormat('all')}
                            className={`px-3 py-1 text-xs rounded border transition-colors ${selectedFormat === 'all' ? 'bg-amber-900/50 border-amber-700 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-600'}`}
                        >
                            ALL
                        </button>
                        {formats.map(f => (
                            <button
                                key={f}
                                onClick={() => setSelectedFormat(f === selectedFormat ? 'all' : f)}
                                className={`px-3 py-1 text-xs uppercase rounded border transition-colors ${selectedFormat === f ? 'bg-amber-900/50 border-amber-700 text-amber-200' : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-600'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tag Explorer */}
                <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Explore Tags</h3>
                    <div className="relative mb-2">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-500" />
                        <input 
                            type="text" 
                            placeholder="Find a tag..." 
                            value={tagSearch}
                            onChange={e => setTagSearch(e.target.value)}
                            className="w-full bg-stone-950 border border-stone-800 rounded px-2 pl-7 py-1.5 text-xs text-stone-300 focus:border-amber-700 outline-none"
                        />
                    </div>
                    <div className="space-y-0.5 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
                        {sortedTags
                            .filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
                            .map(tag => {
                                const isSelected = selectedTags.includes(tag.name);
                                return (
                                    <button
                                        key={tag.name}
                                        onClick={() => toggleTag(tag.name)}
                                        className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between group transition-colors ${isSelected ? 'bg-stone-800 text-amber-500' : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'}`}
                                    >
                                        <span className="truncate pr-2">{tag.name}</span>
                                        <span className={`text-[10px] ${isSelected ? 'text-amber-700' : 'text-stone-700 group-hover:text-stone-600'}`}>{tag.count}</span>
                                    </button>
                                )
                            })
                        }
                    </div>
                </div>
            </div>
        </aside>

        {/* Main Grid Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-stone-950">
            {paginatedBooks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-600 pb-20">
                <Search className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-xl font-serif text-stone-500">No volumes found matching criteria.</p>
                <p className="text-sm mt-2">Try adjusting your filters or boolean operators.</p>
            </div>
            ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8 pb-10">
                {paginatedBooks.map((book) => (
                <div 
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    className="group flex flex-col h-full cursor-pointer perspective-1000"
                >
                    <div className="relative aspect-[2/3] rounded-sm mb-4 shadow-2xl transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-amber-900/20 bg-stone-800 overflow-hidden">
                    <BookCover book={book} className="w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                    </div>
                    
                    <div className="flex-1 flex flex-col min-h-0 px-1">
                        <h3 className="text-stone-200 font-serif text-base leading-tight line-clamp-2 mb-1 group-hover:text-amber-500 transition-colors duration-300" title={book.title}>
                            {book.title}
                        </h3>
                        <p className="text-stone-500 text-xs italic mb-2 line-clamp-1">{book.authors}</p>
                        
                        <div className="mt-auto flex flex-wrap gap-1 opacity-80">
                            {book.tags.slice(0, 3).map(t => {
                                const colors = getTagColor(t);
                                return (
                                    <span key={t} className={`text-[9px] px-1 rounded-sm border ${colors.text} ${colors.border} bg-opacity-10 bg-stone-900`}>
                                        {t}
                                    </span>
                                )
                            })}
                            {book.tags.length > 3 && <span className="text-[9px] text-stone-600">+{book.tags.length - 3}</span>}
                        </div>
                    </div>
                </div>
                ))}
            </div>
            )}
            
            {/* Pagination Footer - Inside the scrollable area */}
            {totalPages > 1 && (
            <div className="py-6 flex justify-center items-center gap-6 shrink-0 z-10">
                <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-full hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-stone-400 hover:text-amber-500"
                >
                <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-stone-400 font-mono text-sm">
                Page <span className="text-stone-200 font-bold">{currentPage}</span> / {totalPages}
                </span>
                <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-full hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-stone-400 hover:text-amber-500"
                >
                <ChevronRight className="w-6 h-6" />
                </button>
            </div>
            )}
        </div>
      </div>

      {/* Book Detail Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm" onClick={() => setSelectedBook(null)}>
          <div 
            className="bg-stone-900 rounded-xl border border-stone-800 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row ring-1 ring-white/10" 
            onClick={e => e.stopPropagation()}
          >
            {/* Left: Cover Art Area */}
            <div className="p-8 md:w-5/12 bg-stone-950 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-stone-800 relative overflow-hidden group">
               <div className="absolute inset-0 opacity-30 blur-2xl scale-110">
                 <BookCover book={selectedBook} className="w-full h-full" showSpine={false} />
               </div>
               <div className="absolute inset-0 bg-stone-950/60"></div>
               
               <div className="w-48 aspect-[2/3] rounded shadow-2xl z-10 transition-transform duration-500 group-hover:scale-105 ring-1 ring-white/10">
                  <BookCover book={selectedBook} className="w-full h-full rounded-sm" />
               </div>
            </div>
            
            {/* Right: Details Area */}
            <div className="p-8 md:w-7/12 relative overflow-y-auto custom-scrollbar bg-stone-900">
                <button 
                    onClick={() => setSelectedBook(null)}
                    className="absolute top-4 right-4 text-stone-500 hover:text-stone-200 transition-colors bg-stone-800/50 hover:bg-stone-800 rounded-full p-2"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-8">
                    <h2 className="text-3xl font-serif font-bold text-stone-100 mb-2 leading-tight">{selectedBook.title}</h2>
                    <p className="text-amber-600 text-lg italic font-serif">{selectedBook.authors}</p>
                </div>

                <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                        <DetailRow label="Publisher" value={selectedBook.publisher || 'Unknown'} />
                        <DetailRow label="Published" value={new Date(selectedBook.timestamp).getFullYear().toString()} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8">
                        <DetailRow label="Language" value={selectedBook.languages.toUpperCase()} />
                        <DetailRow label="Added" value={new Date(selectedBook.timestamp).toLocaleDateString()} />
                    </div>

                    {/* Formats Section */}
                    <div>
                        <span className="text-amber-500/80 text-[10px] uppercase tracking-widest block mb-2 font-bold">File Formats</span>
                        <div className="flex gap-2 flex-wrap">
                            {selectedBook.formats.length > 0 ? (
                                selectedBook.formats.map(fmt => (
                                    <span key={fmt} className="px-3 py-1.5 rounded-md text-xs font-mono font-medium bg-stone-800 border border-stone-700 text-stone-300 uppercase tracking-wide hover:border-stone-500 transition-colors cursor-default">
                                        {fmt}
                                    </span>
                                ))
                            ) : (
                                <span className="text-stone-500 text-sm italic">No formats listed</span>
                            )}
                        </div>
                    </div>
                    
                    <div>
                        <span className="text-amber-500/80 text-[10px] uppercase tracking-widest block mb-3 font-bold">Tags</span>
                        <div className="flex gap-2 flex-wrap">
                            {selectedBook.tags.map(t => {
                                const colors = getTagColor(t);
                                return (
                                    <button 
                                        key={t} 
                                        onClick={() => {
                                            setSelectedTags([t]);
                                            setSelectedBook(null);
                                        }}
                                        className={`px-3 py-1 rounded-full text-xs border transition-all hover:brightness-125 ${colors.bg} ${colors.text} ${colors.border}`}
                                    >
                                        #{t}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <div className="border-b border-stone-800 pb-2">
        <span className="text-amber-500/80 text-[10px] uppercase tracking-widest block mb-1 font-bold">{label}</span>
        <span className="text-stone-300 text-base font-light">{value}</span>
    </div>
);