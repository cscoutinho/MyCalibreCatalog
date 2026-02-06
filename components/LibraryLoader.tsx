import React, { useCallback, useState } from 'react';
import { Upload, FileJson, AlertCircle, Loader2, CloudDownload } from 'lucide-react';
import { CalibreLibrary, Book } from '../types';

interface LibraryLoaderProps {
  onLoaded: (data: CalibreLibrary) => void;
}

export const LibraryLoader: React.FC<LibraryLoaderProps> = ({ onLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateAndLoad = (json: any) => {
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
  };

  const processFile = (file: File) => {
    setLoading(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);
        validateAndLoad(json);
      } catch (err: any) {
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

  const loadFromCloud = async () => {
    setLoading(true);
    setError(null);
    try {
        const response = await fetch('https://raw.githubusercontent.com/cscoutinho/MyCalibreCatalog/refs/heads/main/calibre_library.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch library: ${response.statusText}`);
        }
        const json = await response.json();
        validateAndLoad(json);
    } catch (err: any) {
        console.error(err);
        setError(`Cloud load failed: ${err.message}`);
    } finally {
        setLoading(false);
    }
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
                onClick={loadFromCloud}
                disabled={loading}
                className="flex items-center gap-2 mx-auto text-sm text-stone-500 hover:text-amber-600 transition-colors font-medium disabled:opacity-50"
            >
                <CloudDownload className="w-4 h-4" />
                Load from the cloud
            </button>
        </div>
      </div>
    </div>
  );
};