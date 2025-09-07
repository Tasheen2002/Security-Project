import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { apiRequest } from '../utils/api';
import { escapeHtml } from '../utils/validation';

export default function ProductCard({ 
  product, 
  showQuickActions = true, 
  showAddToCart = true,
  showWishlist = true,
  className = "",
  size = "normal" // normal, large, small
}) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [inWishlist, setInWishlist] = useState(product?.inWishlist || false);
  const [cartMessage, setCartMessage] = useState('');

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!product.inStock) return;

    setAddingToCart(true);
    setCartMessage('');

    try {
      const token = await getAccessTokenSilently();
      await apiRequest('/api/cart', 'POST', {
        productId: product._id,
        quantity: 1
      }, token);

      setCartMessage('Added to cart!');
      setTimeout(() => setCartMessage(''), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setCartMessage('Failed to add');
      setTimeout(() => setCartMessage(''), 2000);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setAddingToWishlist(true);

    try {
      const token = await getAccessTokenSilently();
      
      if (inWishlist) {
        await apiRequest(`/api/wishlist/${product._id}`, 'DELETE', null, token);
        setInWishlist(false);
      } else {
        await apiRequest('/api/wishlist', 'POST', {
          productId: product._id
        }, token);
        setInWishlist(true);
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/products/${product._id}`);
  };

  const calculateDiscount = () => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return 0;
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= (rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const discount = calculateDiscount();
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  return (
    <div className={`bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group ${className}`}>
      <Link to={`/products/${product._id}`} className="block relative">
        {/* Product Image */}
        <div className={`relative bg-gray-100 ${isLarge ? 'aspect-[4/3]' : isSmall ? 'aspect-square' : 'aspect-square'} overflow-hidden`}>
          <img 
            src={product.image || '/placeholder-product.png'} 
            alt={escapeHtml(product.name)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          
          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              -{discount}%
            </div>
          )}
          
          {/* Stock Status */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold bg-red-600 px-3 py-1 rounded">
                Out of Stock
              </span>
            </div>
          )}

          {/* Featured Badge */}
          {product.featured && (
            <div className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              Featured
            </div>
          )}

          {/* Quick Actions Overlay */}
          {showQuickActions && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={handleQuickView}
                  className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Quick View
                </button>
              </div>
            </div>
          )}

          {/* Wishlist Button */}
          {showWishlist && (
            <button
              onClick={handleWishlistToggle}
              disabled={addingToWishlist}
              className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                inWishlist 
                  ? 'bg-red-500 text-white shadow-lg' 
                  : 'bg-white text-gray-600 shadow-md hover:bg-red-50 hover:text-red-500'
              } ${addingToWishlist ? 'opacity-50' : ''}`}
            >
              <svg 
                className="w-4 h-4" 
                fill={inWishlist ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                />
              </svg>
            </button>
          )}
        </div>
      </Link>
      
      {/* Product Details */}
      <div className={`p-4 ${isSmall ? 'p-3' : ''}`}>
        <Link to={`/products/${product._id}`} className="block mb-2">
          <h3 className={`font-semibold text-gray-800 hover:text-blue-600 transition-colors line-clamp-2 ${
            isLarge ? 'text-lg' : isSmall ? 'text-sm' : 'text-base'
          }`}>
            {escapeHtml(product.name)}
          </h3>
        </Link>

        {/* Category */}
        {product.category && (
          <p className={`text-gray-500 capitalize mb-2 ${isSmall ? 'text-xs' : 'text-sm'}`}>
            {escapeHtml(product.category)}
          </p>
        )}

        {/* Rating */}
        {product.averageRating > 0 && (
          <div className="flex items-center space-x-2 mb-2">
            {renderStars(Math.round(product.averageRating))}
            <span className={`text-gray-600 ${isSmall ? 'text-xs' : 'text-sm'}`}>
              ({product.reviewCount || 0})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className={`font-bold text-blue-600 ${isLarge ? 'text-xl' : isSmall ? 'text-base' : 'text-lg'}`}>
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className={`text-gray-500 line-through ${isSmall ? 'text-xs' : 'text-sm'}`}>
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          
          {product.inStock && (
            <span className={`bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium ${isSmall ? 'text-xs' : 'text-xs'}`}>
              In Stock
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Cart Message */}
          {cartMessage && (
            <div className={`text-center py-1 rounded text-sm ${
              cartMessage.includes('Failed') 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {cartMessage}
            </div>
          )}

          <div className="flex space-x-2">
            <Link
              to={`/products/${product._id}`}
              className={`flex-1 bg-blue-100 text-blue-800 py-2 px-3 rounded text-center font-medium hover:bg-blue-200 transition-colors ${
                isSmall ? 'text-xs' : 'text-sm'
              }`}
            >
              View Details
            </Link>
            
            {showAddToCart && (
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock || addingToCart}
                className={`flex-1 py-2 px-3 rounded font-medium transition-colors ${
                  isSmall ? 'text-xs' : 'text-sm'
                } ${
                  !product.inStock || addingToCart
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
            )}
          </div>
        </div>

        {/* Product Description Preview (Large size only) */}
        {isLarge && product.description && (
          <p className="text-gray-600 text-sm mt-3 line-clamp-2">
            {escapeHtml(product.description)}
          </p>
        )}
      </div>
    </div>
  );
}