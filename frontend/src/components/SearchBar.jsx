import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { escapeHtml, sanitizeInput } from '../utils/validation';

export default function SearchBar({ placeholder = "Search products...", className = "" }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.length >= 2) {
      // Debounce search suggestions
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(query);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchSuggestions = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/api/products/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=6`, 'GET');
      setSuggestions(response.suggestions || []);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = sanitizeInput(e.target.value);
    setQuery(value);
  };

  const handleSearch = (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    
    const sanitizedQuery = sanitizeInput(searchQuery.trim());
    setShowSuggestions(false);
    setSelectedIndex(-1);
    navigate(`/search?q=${encodeURIComponent(sanitizedQuery)}`);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          const suggestion = suggestions[selectedIndex];
          if (suggestion.type === 'product') {
            navigate(`/products/${suggestion.id}`);
          } else {
            handleSearch(suggestion.text);
          }
        } else {
          handleSearch();
        }
        break;
        
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
        
      default:
        break;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'product') {
      navigate(`/products/${suggestion.id}`);
    } else {
      setQuery(suggestion.text);
      handleSearch(suggestion.text);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const highlightMatch = (text, searchQuery) => {
    if (!searchQuery) return escapeHtml(text);
    
    const regex = new RegExp(`(${escapeHtml(searchQuery)})`, 'gi');
    const parts = escapeHtml(text).split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) 
        ? `<mark class="bg-yellow-200">${part}</mark>` 
        : part
    ).join('');
  };

  return (
    <div className={`relative ${className}`} ref={inputRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          autoComplete="off"
          spellCheck="false"
        />
        
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id || index}
              ref={el => suggestionRefs.current[index] = el}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`px-4 py-3 cursor-pointer flex items-center space-x-3 border-b border-gray-100 last:border-b-0 ${
                selectedIndex === index 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {suggestion.type === 'product' ? (
                <>
                  <img 
                    src={suggestion.image || '/placeholder-product.png'} 
                    alt={escapeHtml(suggestion.name)}
                    className="w-10 h-10 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p 
                      className="font-medium truncate"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightMatch(suggestion.name, query) 
                      }}
                    />
                    <p className="text-sm text-gray-600">${suggestion.price.toFixed(2)}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="truncate"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightMatch(suggestion.text, query) 
                      }}
                    />
                    {suggestion.category && (
                      <p className="text-sm text-gray-500">in {escapeHtml(suggestion.category)}</p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </div>
          ))}

          {/* Search All Results Option */}
          <div 
            onClick={() => handleSearch()}
            className={`px-4 py-3 cursor-pointer flex items-center space-x-3 border-t border-gray-200 bg-gray-50 ${
              selectedIndex === suggestions.length 
                ? 'bg-blue-50 text-blue-700' 
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium">
                Search for "<span className="text-blue-600">{escapeHtml(query)}</span>"
              </p>
              <p className="text-sm text-gray-500">View all results</p>
            </div>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {showSuggestions && !loading && suggestions.length === 0 && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-4 py-6 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="font-medium">No suggestions found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        </div>
      )}
    </div>
  );
}