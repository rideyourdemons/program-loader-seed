# Search Integration Guide

## Overview

The search functionality allows users to search for pain points (depression, anxiety, etc.) and navigate to their corresponding pages with tools, research, and related content.

## Components Created

### 1. Core Search Engine (`core/pain-point-search.js`)

Main search class that handles:
- Searching pain points by query
- Autocomplete suggestions
- Getting complete pain point page data

### 2. Search Utility (`utils/search-pain-points.js`)

Convenience functions for easy integration:
- `initSearch(firebaseBackend)` - Initialize search
- `searchPainPoints(query, options)` - Search for pain points
- `getAutocompleteSuggestions(query)` - Get autocomplete suggestions
- `getPainPointPage(identifier)` - Get full page data

### 3. React Components

- **SearchBar.jsx.example** - Search bar component with autocomplete
- **PainPointPage.jsx.example** - Full pain point page component

---

## Integration Steps

### Step 1: Initialize Search in Your App

```javascript
// In your app initialization (e.g., App.js or main.js)
import { initSearch } from './utils/search-pain-points.js';
import FirebaseBackend from './core/firebase-backend.js';

// Initialize Firebase backend first
const firebaseBackend = new FirebaseBackend();
await firebaseBackend.initialize(/* your Firebase config */);

// Initialize search
const search = initSearch(firebaseBackend);
```

### Step 2: Add Search Bar to Homepage

```jsx
// Homepage.jsx
import SearchBar from './components/SearchBar';
import { useNavigate } from 'react-router-dom'; // or your routing library

function Homepage() {
  const navigate = useNavigate();

  const handleSearch = (query) => {
    // Navigate to pain point page
    // You'll need to convert query to slug/ID first
    navigate(`/pain-point/${query.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <div>
      <SearchBar 
        onSearch={handleSearch}
        placeholder="Search for help with depression, anxiety, stress..."
      />
      {/* Rest of your homepage */}
    </div>
  );
}
```

### Step 3: Create Pain Point Route

```jsx
// App.jsx or Router.jsx
import PainPointPage from './components/PainPointPage';

// In your routes:
<Route 
  path="/pain-point/:slug" 
  element={<PainPointPage />} 
/>
```

### Step 4: Connect Search to API

Update the SearchBar component to use real search:

```jsx
// In SearchBar.jsx, update the useEffect:
import { getAutocompleteSuggestions } from '../utils/search-pain-points';

useEffect(() => {
  if (query.length >= 2) {
    getAutocompleteSuggestions(query)
      .then(setSuggestions)
      .catch(console.error);
  } else {
    setSuggestions([]);
    setShowSuggestions(false);
  }
}, [query]);
```

Update PainPointPage to fetch real data:

```jsx
// In PainPointPage.jsx:
import { getPainPointPage } from '../utils/search-pain-points';
import { useParams } from 'react-router-dom';

function PainPointPage() {
  const { slug } = useParams();
  // ... existing code ...

  const loadPainPointPage = async () => {
    try {
      setLoading(true);
      const data = await getPainPointPage(slug);
      setPageData(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  // ... rest of component
}
```

### Step 5: Handle Search from SearchBar

When user submits search, convert query to pain point identifier:

```jsx
// In your search handler:
import { searchPainPoints } from '../utils/search-pain-points';

const handleSearch = async (query) => {
  try {
    // Search for matching pain points
    const results = await searchPainPoints(query, { limit: 1 });
    
    if (results.length > 0) {
      // Navigate to first result
      const slug = results[0].slug || results[0].id;
      navigate(`/pain-point/${slug}`);
    } else {
      // Show "not found" message or suggestions
      alert(`No results found for "${query}"`);
    }
  } catch (error) {
    console.error('Search error:', error);
  }
};
```

---

## API Reference

### `searchPainPoints(query, options)`

Search for pain points by query string.

**Parameters:**
- `query` (string): Search query (e.g., "depression", "anxiety")
- `options` (object, optional):
  - `limit` (number): Max results (default: 10)
  - `includeAuthority` (boolean): Include authority scores (default: false)

**Returns:** `Promise<Array>` - Array of pain point objects with search scores

**Example:**
```javascript
const results = await searchPainPoints('depression', { limit: 5 });
// Returns: [{ id: 'depression', title: 'Depression', searchScore: 100, ... }, ...]
```

### `getAutocompleteSuggestions(query)`

Get autocomplete suggestions for partial query.

**Parameters:**
- `query` (string): Partial query (min 2 characters)

**Returns:** `Promise<Array<string>>` - Array of suggestion strings

**Example:**
```javascript
const suggestions = await getAutocompleteSuggestions('dep');
// Returns: ['Depression', 'Depressive Episode', ...]
```

### `getPainPointPage(identifier)`

Get complete pain point page data including tools, research, and related content.

**Parameters:**
- `identifier` (string): Pain point slug or ID

**Returns:** `Promise<Object>` - Complete page data:
```javascript
{
  painPoint: { id, title, description, ... },
  gate: { id, title, ... },
  tools: [{ id, title, description, ... }, ...],
  research: [{ id, title, authors, ... }, ...],
  relatedPainPoints: [{ id, title, ... }, ...]
}
```

**Example:**
```javascript
const pageData = await getPainPointPage('depression');
// Returns complete page data object
```

---

## Search Algorithm

The search uses a scoring system:

1. **Exact title match**: 100 points
2. **Title starts with query**: 90 points
3. **Title contains query**: 80 points
4. **Slug contains query**: 75 points
5. **Keyword match**: 70 points
6. **Synonym match**: 65 points
7. **Description contains query**: 60 points

Results are sorted by score (highest first).

---

## Firebase Data Structure

Ensure your Firestore has this structure:

### Collection: `painPoints`

```javascript
{
  id: "depression",
  data: {
    title: "Depression",
    slug: "depression",
    description: "Description of depression...",
    keywords: ["depression", "depressed", "sadness"],
    synonyms: ["major depressive disorder", "MDD"],
    gateId: "emotional-wellbeing",
    tools: ["tool-1-id", "tool-2-id", "tool-3-id"],
    researchIds: ["research-1-id", ...],
    // ... other fields
  }
}
```

---

## Testing

Test search functionality:

```bash
npm run test-search
```

Or manually test in Node.js:

```javascript
import { initSearch, searchPainPoints } from './utils/search-pain-points.js';
import FirebaseBackend from './core/firebase-backend.js';

async function test() {
  const firebase = new FirebaseBackend();
  await firebase.initialize(/* config */);
  
  initSearch(firebase);
  
  const results = await searchPainPoints('depression');
  console.log('Search results:', results);
}

test();
```

---

## Next Steps

1. ✅ Search engine created
2. ✅ React components created
3. ⏳ Connect to your React app
4. ⏳ Set up routing
5. ⏳ Style components to match your design
6. ⏳ Test with real Firebase data
7. ⏳ Add analytics tracking
8. ⏳ Optimize search performance

---

## Notes

- Search currently uses client-side filtering (gets all pain points then filters)
- For large datasets, consider implementing server-side search or using Algolia/Elasticsearch
- Authority scores are optional but recommended for better ranking
- All search operations are read-only (no data modification)

