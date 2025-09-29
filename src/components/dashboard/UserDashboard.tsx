"use client";

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

// Define ProductWithAccess interface locally
interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  url?: string;
  domain?: string;
  isActive: boolean;
}

interface UserProductAccess {
  id: string;
  userId: string;
  productId: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProductWithAccess extends Product {
  userAccess?: UserProductAccess;
}

interface UserDashboardProps {
  user: any;
}

export default function UserDashboard({ user }: UserDashboardProps) {
  const [products, setProducts] = useState<ProductWithAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch products and user access
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (err) {
      setError('Failed to load products');
      console.error('Products fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Product-related functions
  const getProducts = async (): Promise<ProductWithAccess[]> => {
    try {
      // Fetch user's assigned apps from API
      const userApps = await apiClient.getUserApps();
      
      // Transform the API response to match the expected format
      const products: ProductWithAccess[] = userApps.map((app, index) => ({
        id: app.id,
        name: app.name,
        slug: app.slug,
        description: app.description || 'No description available',
        icon: getAppIcon(app.slug),
        color: getAppColor(app.slug),
        isActive: app.isActive,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        userAccess: {
          id: `${index + 1}`,
          userId: user?.id || '',
          productId: app.id,
          isActive: true,
          assignedAt: app.access?.assignedAt || new Date().toISOString(),
          usedQuota: app.access?.usedQuota || 0,
          permissions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }));

      return products;
    } catch (error) {
      console.error('Error fetching user apps:', error);
      // Return empty array if API call fails
      return [];
    }
  };

  // Helper function to get app icon based on slug
  const getAppIcon = (slug: string): string => {
    const iconMap: { [key: string]: string } = {
      'hr-management': '👥',
      'drive': '💾',
      'connect': '💬',
      'crm-system': '📊',
      'project-tracker': '📋',
      'admin-dashboard': '🛡️',
      'user-management': '👤',
      'security-center': '🔒'
    };
    return iconMap[slug] || '📱';
  };

  // Helper function to get app color based on slug
  const getAppColor = (slug: string): string => {
    const colorMap: { [key: string]: string } = {
      'hr-management': '#3B82F6',
      'drive': '#10B981',
      'connect': '#8B5CF6',
      'crm-system': '#F59E0B',
      'project-tracker': '#EF4444',
      'admin-dashboard': '#6366F1',
      'user-management': '#06B6D4',
      'security-center': '#DC2626'
    };
    return colorMap[slug] || '#3B82F6';
  };

  const handleProductAccess = async (product: ProductWithAccess) => {
    try {
      console.log('Accessing product:', product.name);
      
      // Get SSO token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('Please log in to access products');
        return;
      }

      // Generate SSO token for the app
      const response = await fetch(`/api/apps/${product.slug}/sso-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate SSO token');
      }

      const { ssoToken } = await response.json();
      
      // Get the actual app URL from the API
      const appDetails = await apiClient.getAppBySlug(product.slug);
      
      if (appDetails && appDetails.url) {
        // Redirect directly to the actual app URL with SSO token
        const appUrl = `${appDetails.url}?sso_token=${ssoToken}`;
        console.log(`Redirecting to actual app URL: ${appUrl}`);
        window.open(appUrl, '_blank');
      } else {
        // Fallback: redirect to the portal page if no URL is configured
        const appUrl = `${window.location.origin}/${product.slug}?sso_token=${ssoToken}`;
        console.log(`No app URL configured, redirecting to portal: ${appUrl}`);
        window.open(appUrl, '_blank');
      }
      
    } catch (error) {
      console.error('Error accessing product:', error);
      alert(`Failed to access ${product.name}. Please try again.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="space-y-8 p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-800">Error Loading Products</h3>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-6">
            <span className="text-3xl">📦</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your Products
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Access your assigned products and start collaborating with your team
          </p>
        </div>

        {/* Products Section */}
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-6 lg:space-y-0">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                      <span className="text-3xl">🚀</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{products.length}</span>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      My Products
                    </h2>
                    <p className="text-lg text-gray-600 mt-2">
                      Access your assigned products and tools
                    </p>
                  </div>
                </div>
                
                {/* Enhanced Stats */}
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {products.length}
                    </div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Products Available
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {products.filter(p => p.isActive).length}
                    </div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Active Services
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 animate-pulse">
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                  </div>
                  
                  {/* Product Icon */}
                  <div className="mb-6">
                    <div className="h-20 w-20 bg-gray-200 rounded-2xl"></div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="mb-8">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                  
                  {/* Access Button */}
                  <div className="h-12 bg-gray-200 rounded-2xl"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product, index) => (
                <div 
                  key={product.id} 
                  className="group relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Card Container */}
                  <div 
                    className="relative bg-white rounded-3xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-500 transform hover:-translate-y-2 cursor-pointer overflow-hidden"
                    onClick={() => handleProductAccess(product)}
                  >
                    {/* Background Gradient */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl"
                      style={{ background: `linear-gradient(135deg, ${product.color}20, ${product.color}40)` }}
                    ></div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.isActive 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>

                    {/* Product Icon */}
                    <div className="relative mb-6">
                      <div 
                        className="h-20 w-20 rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110"
                        style={{ 
                          backgroundColor: product.color + '15', 
                          color: product.color,
                          border: `2px solid ${product.color}20`
                        }}
                      >
                        {product.icon}
                      </div>
                      {/* Icon Glow Effect */}
                      <div 
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-md"
                        style={{ backgroundColor: product.color }}
                      ></div>
                    </div>

                    {/* Product Info */}
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 leading-relaxed line-clamp-3">
                        {product.description}
                      </p>
                    </div>

                    {/* Access Button */}
                    <button 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group-hover:shadow-2xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductAccess(product);
                      }}
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <span className="text-lg">Access Product</span>
                        <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </button>

                    {/* Hover Effect Overlay */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100/50 via-blue-100/30 to-purple-100/50 rounded-3xl blur-2xl"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-16 text-center shadow-xl border border-white/20">
                <div className="relative mb-8">
                  <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl mb-6 shadow-lg">
                    <span className="text-6xl">📦</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-sm">!</span>
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
                  No Products Assigned
                </h3>
                <p className="text-gray-600 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
                  You don't have any products assigned yet. Contact your administrator to get access to the tools you need for your work.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <button
                    onClick={() => alert('Contact admin feature coming soon!')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">📧</span>
                      <span>Request Access</span>
                    </div>
                  </button>
                  <button
                    onClick={() => alert('Help center coming soon!')}
                    className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-semibold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">❓</span>
                      <span>Get Help</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
