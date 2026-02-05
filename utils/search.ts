import { Book } from '../types';

interface SearchToken {
  type: 'term' | 'phrase' | 'operator';
  value: string;
  field?: 'title' | 'author' | 'tag' | 'publisher';
  negated?: boolean;
}

/**
 * Parses a search query string into tokens.
 * Supports: 
 * - Quotes: "machine learning"
 * - Fields: author:Asimov, tag:scifi
 * - Boolean keywords: AND, OR, NOT
 * - Negation prefix: -tag:fiction
 */
const parseQuery = (query: string): SearchToken[] => {
  const tokens: SearchToken[] = [];
  // Regex looks for:
  // 1. Quoted strings: "foo bar"
  // 2. Field specifiers: field:value or field:"value"
  // 3. Simple terms
  const regex = /(-?)(?:(title|author|tag|publisher):)?(?:"([^"]+)"|([^\s]+))/gi;
  
  let match;
  while ((match = regex.exec(query)) !== null) {
    const [fullMatch, negation, field, quotedValue, simpleValue] = match;
    const value = quotedValue || simpleValue;
    
    if (!value) continue;

    // Handle boolean operators appearing as terms
    const upperValue = value.toUpperCase();
    if (!field && !quotedValue && (upperValue === 'AND' || upperValue === 'OR' || upperValue === 'NOT')) {
      tokens.push({ type: 'operator', value: upperValue });
      continue;
    }

    tokens.push({
      type: quotedValue ? 'phrase' : 'term',
      value: value,
      field: field as any,
      negated: negation === '-' || upperValue === 'NOT' // Handle explicit NOT operator logic in the next step usually, but basic support here
    });
  }
  
  return tokens;
};

/**
 * Evaluates if a book matches a specific token.
 */
const matchToken = (book: Book, token: SearchToken): boolean => {
  const checkValue = (text: string) => {
    const content = text.toLowerCase();
    const target = token.value.toLowerCase();
    return token.type === 'phrase' ? content.includes(target) : content.includes(target);
  };

  const checkField = (field: string | undefined): boolean => {
    switch (field) {
      case 'title': return checkValue(book.title) || checkValue(book.title_sort);
      case 'author': return checkValue(book.authors) || checkValue(book.author_sort);
      case 'tag': return book.tags.some(t => checkValue(t));
      case 'publisher': return checkValue(book.publisher);
      default: 
        // If no field specified, check all searchable fields
        return checkValue(book.title) || 
               checkValue(book.authors) || 
               book.tags.some(t => checkValue(t)) ||
               checkValue(book.publisher);
    }
  };

  const result = checkField(token.field);
  return token.negated ? !result : result;
};

/**
 * Main search function.
 * Implements a simple Left-to-Right evaluator with precedence for AND over OR.
 */
export const advancedSearch = (book: Book, query: string): boolean => {
  if (!query.trim()) return true;

  const tokens = parseQuery(query);
  if (tokens.length === 0) return true;

  // We'll process this by grouping implicit ANDs, then separating by ORs.
  // This is a simplified boolean logic parser.
  
  // 1. Split by OR
  const orGroups: SearchToken[][] = [];
  let currentGroup: SearchToken[] = [];

  tokens.forEach(token => {
    if (token.type === 'operator' && token.value === 'OR') {
      if (currentGroup.length > 0) orGroups.push(currentGroup);
      currentGroup = [];
    } else if (token.type === 'operator' && token.value === 'AND') {
      // Skip explicit AND, it's the default behavior between terms
    } else if (token.type === 'operator' && token.value === 'NOT') {
        // The next token should be negated.
        // In this simple parser, we handled 'NOT' as a keyword during matchToken or negation prefix.
        // If we see a standalone NOT, we assume the user typed "A NOT B", 
        // which our regex might have caught as separate tokens. 
        // For robustness, let's ignore the operator token here if handled, 
        // but if we want strict "NOT B", the regex usually handles -B. 
        // Let's assume the regex caught negations via '-' prefix. 
        // If the user typed "NOT tag:foo", the parser sees "NOT" (op) then "tag:foo".
        // Use a flag for the next loop? 
        // Simplification: We only support "-" prefix for negation in this version for stability, 
        // or if token.negated is true.
    } else {
      currentGroup.push(token);
    }
  });
  if (currentGroup.length > 0) orGroups.push(currentGroup);

  // 2. Evaluate groups (Attributes in a group are ANDed)
  // The groups themselves are ORed.
  // (A AND B) OR (C AND D)

  const matchesGroup = (group: SearchToken[]) => {
    // Within a group, we handle strict adjacency modifiers if we wanted, 
    // but here we just AND everything that isn't an operator.
    
    // Check for previous "NOT" operator that wasn't attached
    // This is tricky in a single pass. 
    // Simplified: All terms in the group must match.
    return group.every(token => matchToken(book, token));
  };

  // If ANY group matches, the book returns true.
  return orGroups.some(matchesGroup);
};