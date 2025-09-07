import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { escapeHtml } from '../utils/validation';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!orderId) {
      navigate('/');
      return;
    }
    
    fetchOrder();
  }, [isAuthenticated, orderId, navigate]);

  const fetchOrder = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await apiRequest(`/api/orders/${orderId}`, 'GET', null, token);
      setOrder(response.order);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      if (error.status === 404) {
        setError('Order not found');
      } else {
        setError('Failed to load order details');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
        </div>
        <Link 
          to="/orders" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View My Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
        <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link 
          to="/" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Success Header */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-green-800 mb-2">Order Confirmed!</h1>
        <p className="text-green-700">Thank you for your purchase. Your order has been successfully placed.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Order Details</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono font-semibold">{order.orderId}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order Date:</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                  {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Method:</span>
                <span className="capitalize">
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                   order.paymentMethod === 'card' ? 'Credit/Debit Card' : 
                   order.paymentMethod}
                </span>
              </div>
              
              {order.trackingNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tracking Number:</span>
                  <span className="font-mono font-semibold">{order.trackingNumber}</span>
                </div>
              )}
              
              {order.estimatedDelivery && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Estimated Delivery:</span>
                  <span>{formatDate(order.estimatedDelivery)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            <div className="text-gray-700">
              <p className="font-medium">
                {escapeHtml(order.shipping.firstName)} {escapeHtml(order.shipping.lastName)}
              </p>
              <p>{escapeHtml(order.shipping.address)}</p>
              <p>{escapeHtml(order.shipping.city)}, {escapeHtml(order.shipping.district)} {escapeHtml(order.shipping.postalCode)}</p>
              <p className="mt-2">
                <span className="text-gray-600">Email:</span> {escapeHtml(order.shipping.email)}
              </p>
              <p>
                <span className="text-gray-600">Phone:</span> {escapeHtml(order.shipping.phone)}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items & Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={item.image || '/placeholder-product.png'} 
                      alt={escapeHtml(item.productName)}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium">{escapeHtml(item.productName)}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${order.totals.subtotal.toFixed(2)}</span>
              </div>
              
              {order.totals.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${order.totals.tax.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{order.totals.shipping > 0 ? `$${order.totals.shipping.toFixed(2)}` : 'Free'}</span>
              </div>
              
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${order.totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link 
              to="/orders"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors block text-center font-medium"
            >
              View All Orders
            </Link>
            
            <Link 
              to="/"
              className="w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors block text-center font-medium"
            >
              Continue Shopping
            </Link>
            
            {['pending', 'confirmed'].includes(order.orderStatus) && (
              <button 
                className="w-full bg-red-100 text-red-800 py-3 px-4 rounded-lg hover:bg-red-200 transition-colors font-medium"
                onClick={() => navigate(`/orders/${order.orderId}/cancel`)}
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {order.notes && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Order Notes</h3>
          <p className="text-blue-700">{escapeHtml(order.notes)}</p>
        </div>
      )}

      {order.paymentMethod === 'cod' && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Cash on Delivery</h3>
          <p className="text-yellow-700">
            Please have the exact amount ready when your order arrives. Our delivery person will collect 
            <strong> ${order.totals.total.toFixed(2)}</strong> upon delivery.
          </p>
        </div>
      )}
    </div>
  );
}