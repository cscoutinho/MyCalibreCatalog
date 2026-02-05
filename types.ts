export interface Book {
  id: number;
  title: string;
  title_sort: string;
  authors: string; // Comma separated string in JSON
  author_sort: string;
  publisher: string;
  timestamp: string; // ISO Date string
  tags: string[];
  formats: string[];
  languages: string; // Comma separated ISO codes
}

export interface CalibreLibrary {
  books: Book[];
}

export interface FilterState {
  search: string;
  authors: string[];
  tags: string[];
  languages: string[];
  formats: string[];
}
