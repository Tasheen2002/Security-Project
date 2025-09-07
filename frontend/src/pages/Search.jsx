import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { apiRequest } from '../utils/api';
import { escapeHtml } from '../utils/validation';
import SearchBar from '../components/SearchBar';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(null);
  const [categories, setCategories] = useState([]);
  const [addingToCart, setAddingToCart] = useState({});

  // Search filters
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'relevance',
    page: parseInt(searchParams.get('page')) || 1,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Update filters when URL params change
    setFilters({
      query: searchParams.get('q') || '',
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sortBy: searchParams.get('sortBy') || 'relevance',
      page: parseInt(searchParams.get('page')) || 1,
    });
    
    fetchProducts();
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await apiRequest('/api/products/categories', 'GET');
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      
      if (filters.query) params.append('search', filters.query);
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.sortBy && filters.sortBy !== 'relevance') {
        params.append('sortBy', filters.sortBy === 'price_low' ? 'price' : filters.sortBy === 'price_high' ? 'price' : filters.sortBy);
        params.append('sortOrder', filters.sortBy === 'price_high' ? 'desc' : 'asc');
      }
      params.append('page', filters.page.toString());
      params.append('limit', '12');

      const response = await apiRequest(`/api/products?${params.toString()}`, 'GET');
      setProducts(response.products || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setError('Failed to load search results');
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    
    // Update URL
    const params = new URLSearchParams();
    if (updatedFilters.query) params.append('q', updatedFilters.query);
    if (updatedFilters.category) params.append('category', updatedFilters.category);
    if (updatedFilters.minPrice) params.append('minPrice', updatedFilters.minPrice);
    if (updatedFilters.maxPrice) params.append('maxPrice', updatedFilters.maxPrice);
    if (updatedFilters.sortBy !== 'relevance') params.append('sortBy', updatedFilters.sortBy);
    if (updatedFilters.page > 1) params.append('page', updatedFilters.page.toString());
    
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    const updatedFilters = { ...filters, page };
    setFilters(updatedFilters);
    
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setAddingToCart(prev => ({ ...prev, [productId]: true }));

    try {
      const token = await getAccessTokenSilently();
      await apiRequest('/api/cart', 'POST', {
        productId,
        quantity: 1
      }, token);
      
      // Show success message (you could add a toast notification here)
      console.log('Added to cart successfully');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add item to cart');
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'relevance',
      page: 1,
    });
    setSearchParams(new URLSearchParams());
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Searching products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          {filters.query ? `Search Results for "${escapeHtml(filters.query)}"` : 'Search Products'}
        </h1>
        
        <div className="max-w-lg">
          <SearchBar 
            placeholder="Search products..."
            className="w-full"
          />
        </div>

        {pagination && (
          <p className="text-gray-600 mt-4">
            Found {pagination.totalProducts} product{pagination.totalProducts !== 1 ? 's' : ''}
            {filters.query && ` for "${escapeHtml(filters.query)}"`}
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear All
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Category</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    checked={filters.category === ''}
                    onChange={(e) => updateFilters({ category: e.target.value })}
                    className="mr-2"
                  />
                  All Categories
                </label>
                {categories.map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={category}
                      checked={filters.category === category}
                      onChange={(e) => updateFilters({ category: e.target.value })}
                      className="mr-2"
                    />
                    {escapeHtml(category)}
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Price Range</h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => updateFilters({ minPrice: e.target.value })}
                  className="p-2 border border-gray-300 rounded text-sm"
                  min="0"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                  className="p-2 border border-gray-300 rounded text-sm"
                  min="0"
                />
              </div>
            </div>

            {/* Sort Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Sort By</h3>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilters({ sortBy: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="relevance">Relevance</option>
                <option value="name">Name A-Z</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="createdAt">Newest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {products.length === 0 && !loading ? (
            <div className="text-center py-12">
              <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h2 className="text-xl font-semibold mb-2">No products found</h2>
              <p className="text-gray-600 mb-6">
                {filters.query 
                  ? `No products match your search for "${escapeHtml(filters.query)}"`
                  : "No products match your current filters"
                }
              </p>
              <button
                onClick={clearFilters}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {products.map((product) => (
                  <div key={product._id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <Link to={`/products/${product._id}`} className="block">
                      <div className="aspect-square bg-gray-100">
                        <img 
                          src={product.image || '/placeholder-product.png'} 
                          alt={escapeHtml(product.name)}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    </Link>
                    
                    <div className="p-4">
                      <Link to={`/products/${product._id}`} className="block mb-2">
                        <h3 className="font-semibold text-gray-800 hover:text-blue-600 line-clamp-2">
                          {escapeHtml(product.name)}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-blue-600">
                            ${product.price.toFixed(2)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ${product.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        {product.inStock ? (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            In Stock
                          </span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Link
                          to={`/products/${product._id}`}
                          className="flex-1 bg-blue-100 text-blue-800 py-2 px-3 rounded text-center text-sm font-medium hover:bg-blue-200 transition-colors"
                        >
                          View Details
                        </Link>
                        
                        <button
                          onClick={() => handleAddToCart(product._id)}
                          disabled={!product.inStock || addingToCart[product._id]}
                          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                            !product.inStock || addingToCart[product._id]
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {addingToCart[product._id] ? 'Adding...' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-lg ${
                            filters.page === page 
                              ? 'bg-blue-600 text-white' 
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    {pagination.totalPages > 5 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={!pagination.hasNext}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Results Summary */}
              {pagination && (
                <div className="text-center text-sm text-gray-600 mt-6">
                  Showing {((filters.page - 1) * 12) + 1} - {Math.min(filters.page * 12, pagination.totalProducts)} of {pagination.totalProducts} results
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}