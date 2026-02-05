import React, { useCallback, useState } from 'react';
import { Upload, FileJson, AlertCircle, Loader2 } from 'lucide-react';
import { CalibreLibrary, Book } from '../types';

interface LibraryLoaderProps {
  onLoaded: (data: CalibreLibrary) => void;
}

// Sample data generator for demonstration purposes
const generateSampleData = (): CalibreLibrary => {
  const books: Book[] = [
    {
      id: 36,
      title: "Definindo Liberdade: 50 Questões Fundamentais",
      title_sort: "Definindo Liberdade: 50 Questões Fundamentais",
      authors: "Ron Paul",
      author_sort: "Mises Brasil",
      publisher: "Mises",
      timestamp: "2013-12-22T00:40:13-03:00",
      tags: ["politics", "economics", "libertarian"],
      formats: ["epub"],
      languages: "por"
    },
    {
      id: 37,
      title: "Doutor Fausto",
      title_sort: "Doutor Fausto",
      authors: "Thomas Mann",
      author_sort: "Mann, Thomas",
      publisher: "Nova Fronteira",
      timestamp: "2013-12-22T00:40:16-03:00",
      tags: ["fiction", "classics", "german literature"],
      formats: ["epub", "mobi"],
      languages: "por"
    },
    {
      id: 46,
      title: "O Diabo",
      title_sort: "Diabo, O",
      authors: "Liev Tolstói",
      author_sort: "Tolstói, Liev",
      publisher: "L&PM Pocket",
      timestamp: "2013-12-22T00:40:41-03:00",
      tags: ["fiction", "russian literature", "short stories"],
      formats: ["epub"],
      languages: "por"
    },
    {
      id: 101,
      title: "Neuromancer",
      title_sort: "Neuromancer",
      authors: "William Gibson",
      author_sort: "Gibson, William",
      publisher: "Ace",
      timestamp: "2023-01-15T10:00:00-00:00",
      tags: ["sci-fi", "cyberpunk"],
      formats: ["epub", "pdf"],
      languages: "eng"
    },
    {
      id: 102,
      title: "The Hitchhiker's Guide to the Galaxy",
      title_sort: "Hitchhiker's Guide to the Galaxy, The",
      authors: "Douglas Adams",
      author_sort: "Adams, Douglas",
      publisher: "Pan Books",
      timestamp: "2023-02-20T14:30:00-00:00",
      tags: ["sci-fi", "comedy", "humor"],
      formats: ["epub"],
      languages: "eng"
    }
  ];
  return { books };
};

export const LibraryLoader: React.FC<LibraryLoaderProps> = ({ onLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const processFile = (file: File) => {
    setLoading(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        // Basic check if it looks like the calibre export
        const json = JSON.parse(text);
        
        // Handle both raw array or object with "books" key
        let booksData: Book[] = [];
        if (Array.isArray(json)) {
            booksData = json;
        } else if (json.books && Array.isArray(json.books)) {
            booksData = json.books;
        } else {
            throw new Error("Invalid format. Expected root object with 'books' array.");
        }

        if (booksData.length > 0 && !booksData[0].title) {
            throw new Error("Data doesn't look like book records (missing title).");
        }

        onLoaded({ books: booksData });
      } catch (err) {
        console.error(err);
        setError("Failed to parse JSON. Please ensure it matches the Calibre export format.");
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
        setError("Error reading file.");
        setLoading(false);
    }
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const loadSample = () => {
    setLoading(true);
    setTimeout(() => {
        onLoaded(generateSampleData());
        setLoading(false);
    }, 800);
  };

  return (
    <div className="h-full flex items-center justify-center bg-stone-950 p-6">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-serif font-bold text-stone-100 mb-4 tracking-tight">
            Calibre <span className="text-amber-600">Librarian</span>
          </h1>
          <p className="text-stone-400 font-serif italic text-lg">
            Import your metadata.json to explore your library.
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
            ${isDragging 
              ? 'border-amber-600 bg-amber-900/10 scale-105' 
              : 'border-stone-800 hover:border-amber-600/50 hover:bg-stone-900'
            }
          `}
        >
          <input
            type="file"
            accept=".json"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          
          <div className="flex flex-col items-center gap-4 pointer-events-none">
            <div className={`p-5 rounded-full ${isDragging ? 'bg-amber-600 text-white' : 'bg-stone-900 text-stone-500 border border-stone-800'}`}>
              {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <FileJson className="w-8 h-8" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-stone-200">
                {loading ? "Processing Library..." : "Drop your metadata.json here"}
              </h3>
              <p className="text-sm text-stone-500 mt-2">
                or click to browse files
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-3 text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mt-8 text-center">
            <button 
                onClick={loadSample}
                className="text-sm text-stone-500 hover:text-amber-600 underline transition-colors font-medium"
            >
                Use sample data (Demo)
            </button>
        </div>
      </div>
    </div>
  );
};