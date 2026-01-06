
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home as HomeIcon, 
  ShoppingBag, 
  User as UserIcon, 
  Search, 
  Bell, 
  MapPin, 
  ShoppingCart,
  ArrowLeft,
  ChevronRight,
  Plus,
  Minus,
  Star,
  Clock,
  LogOut,
  Camera,
  ClipboardList,
  X,
  Wallet,
  Edit2,
  Check
} from 'lucide-react';
import { AppView, User, Vendor, Product, CartItem, Order, OrderStatus, Address } from './types';

// Mock Data
const VENDORS: Vendor[] = [
  { id: '1', name: 'Gourmet Grill', category: 'Restaurants', rating: 4.8, isOpen: true, deliveryTime: '20-30 min', deliveryFee: 5.0, image: 'https://picsum.photos/seed/food1/400/300' },
  { id: '2', name: 'City Mart', category: 'Supermarkets', rating: 4.5, isOpen: true, deliveryTime: '45-60 min', deliveryFee: 7.5, image: 'https://picsum.photos/seed/shop1/400/300' },
  { id: '3', name: 'Wellness Rx', category: 'Pharmacies', rating: 4.9, isOpen: true, deliveryTime: '15-25 min', deliveryFee: 4.0, image: 'https://picsum.photos/seed/med1/400/300' },
  { id: '4', name: 'Style Hub', category: 'Retail stores', rating: 4.2, isOpen: false, deliveryTime: '30-45 min', deliveryFee: 8.0, image: 'https://picsum.photos/seed/retail1/400/300' },
];

const PRODUCTS: Product[] = [
  { id: 'p1', vendorId: '1', name: 'Classic Burger', price: 12.5, available: true, image: 'https://picsum.photos/seed/p1/200/200', description: 'Juicy beef patty with fresh lettuce and tomato.' },
  { id: 'p2', vendorId: '1', name: 'Cheesy Fries', price: 5.0, available: true, image: 'https://picsum.photos/seed/p2/200/200' },
  { id: 'p3', vendorId: '2', name: 'Milk 1L', price: 2.2, available: true, image: 'https://picsum.photos/seed/p3/200/200' },
  { id: 'p4', vendorId: '2', name: 'Bread Loaf', price: 1.8, available: true, image: 'https://picsum.photos/seed/p4/200/200' },
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('home');
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<AppView>('home');
  const [notificationCount, setNotificationCount] = useState(2);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Address State
  const [addresses, setAddresses] = useState<Address[]>([
    { id: 'a1', label: 'Home', details: '123 Green Valley, Apt 4B', isDefault: true },
    { id: 'a2', label: 'Office', details: '456 Business Plaza, 10th Floor', isDefault: false },
  ]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('a1');
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', details: '' });

  // Cefane Specific State
  const [cefaneText, setCefaneText] = useState('');
  const [cefaneImage, setCefaneImage] = useState<string | null>(null);
  const [cefaneBudget, setCefaneBudget] = useState('');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle back to home if user exists, else auth
  useEffect(() => {
    if (!user && view !== 'auth') {
      setView('auth');
    }
  }, [user, view]);

  const addToCart = (product: Product, vendor: Vendor) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, vendor, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.product.id !== productId);
    });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  }, [cart]);

  const placeOrder = (type: 'Marketplace' | 'Cefane', details?: any) => {
    const budget = parseFloat(cefaneBudget);
    
    if (type === 'Cefane' && editingOrderId) {
      // Update existing order
      setOrders(prev => prev.map(order => 
        order.id === editingOrderId 
          ? { 
              ...order, 
              shoppingList: cefaneText, 
              receiptImage: cefaneImage || undefined, 
              budgetLimit: !isNaN(budget) ? budget : undefined,
              deliveryAddressId: selectedAddressId
            } 
          : order
      ));
      setEditingOrderId(null);
    } else {
      // Create new order
      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        status: OrderStatus.PENDING,
        date: new Date().toLocaleDateString(),
        total: type === 'Marketplace' ? cartTotal + 5.0 : 0, 
        items: type === 'Marketplace' ? [...cart] : undefined,
        shoppingList: type === 'Cefane' ? cefaneText : undefined,
        receiptImage: type === 'Cefane' ? (cefaneImage || undefined) : undefined,
        budgetLimit: type === 'Cefane' && !isNaN(budget) ? budget : undefined,
        deliveryAddressId: selectedAddressId,
        ...details
      };
      setOrders([newOrder, ...orders]);
    }

    if (type === 'Marketplace') setCart([]);
    if (type === 'Cefane') {
      setCefaneText('');
      setCefaneImage(null);
      setCefaneBudget('');
    }
    setView('tracking');
    setActiveTab('tracking');
  };

  const handleEditCefaneOrder = (order: Order) => {
    setEditingOrderId(order.id);
    setCefaneText(order.shoppingList || '');
    setCefaneImage(order.receiptImage || null);
    setCefaneBudget(order.budgetLimit ? order.budgetLimit.toString() : '');
    setSelectedAddressId(order.deliveryAddressId || 'a1');
    setView('cefane');
  };

  const cancelCefaneEdit = () => {
    setEditingOrderId(null);
    setCefaneText('');
    setCefaneImage(null);
    setCefaneBudget('');
    setView('tracking');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCefaneImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAddress = () => {
    if (newAddress.label && newAddress.details) {
      const id = 'a' + (addresses.length + 1);
      setAddresses([...addresses, { id, ...newAddress, isDefault: false }]);
      setSelectedAddressId(id);
      setIsAddingAddress(false);
      setNewAddress({ label: '', details: '' });
    }
  };

  const currentVendor = useMemo(() => VENDORS.find(v => v.id === selectedVendorId), [selectedVendorId]);
  const filteredProducts = useMemo(() => PRODUCTS.filter(p => p.vendorId === selectedVendorId), [selectedVendorId]);
  const currentAddress = useMemo(() => addresses.find(a => a.id === selectedAddressId), [addresses, selectedAddressId]);

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50">
      <button onClick={() => {setView('home'); setActiveTab('home'); setEditingOrderId(null);}} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-green-600' : 'text-gray-400'}`}>
        <HomeIcon size={24} />
        <span className="text-[10px] mt-1 font-medium">Home</span>
      </button>
      <button onClick={() => {setView('marketplace'); setActiveTab('marketplace'); setEditingOrderId(null);}} className={`flex flex-col items-center ${activeTab === 'marketplace' ? 'text-green-600' : 'text-gray-400'}`}>
        <ShoppingBag size={24} />
        <span className="text-[10px] mt-1 font-medium">Orders</span>
      </button>
      <button onClick={() => {setView('tracking'); setActiveTab('tracking'); setEditingOrderId(null);}} className={`flex flex-col items-center ${activeTab === 'tracking' ? 'text-green-600' : 'text-gray-400'}`}>
        <Clock size={24} />
        <span className="text-[10px] mt-1 font-medium">Activity</span>
      </button>
      <button onClick={() => {setView('profile'); setActiveTab('profile'); setEditingOrderId(null);}} className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-green-600' : 'text-gray-400'}`}>
        <UserIcon size={24} />
        <span className="text-[10px] mt-1 font-medium">Profile</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 max-w-md mx-auto bg-white shadow-sm overflow-x-hidden relative">
      {/* Auth Screen */}
      {view === 'auth' && (
        <div className="px-8 pt-20 flex flex-col items-center text-center animate-fadeIn">
          <div className="w-24 h-24 bg-green-600 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
            <ShoppingBag size={48} color="white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Amana Rides</h1>
          <p className="text-gray-500 mb-12">Your marketplace & errand partner</p>
          
          <div className="w-full space-y-4">
            <input 
              type="text" 
              placeholder="Email or Phone Number" 
              className="w-full px-4 py-4 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
            />
            <button 
              onClick={() => {
                setUser({ id: '1', name: 'John Doe', phone: '+123456789', email: 'john@example.com' });
                setView('home');
              }}
              className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold shadow-md hover:bg-green-700 transition-colors"
            >
              Sign In / Sign Up
            </button>
            <div className="flex items-center gap-2 py-4">
              <div className="h-[1px] bg-gray-200 flex-1"></div>
              <span className="text-gray-400 text-sm">or</span>
              <div className="h-[1px] bg-gray-200 flex-1"></div>
            </div>
            <p className="text-xs text-gray-400 px-6">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      )}

      {/* Home View */}
      {view === 'home' && user && (
        <div className="animate-fadeIn">
          {/* Header */}
          <div className="px-5 pt-6 pb-2 flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowAddressPicker(true)}>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                <MapPin size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Deliver to</span>
                <span className="text-sm font-semibold flex items-center gap-1">{currentAddress?.label} <ChevronRight size={12} className="rotate-90" /></span>
              </div>
            </div>
            <div className="relative">
              <Bell size={24} className="text-gray-700" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {notificationCount}
                </span>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="px-5 mt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Search food, groceries, stores" 
                className="w-full pl-12 pr-4 py-3 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Service Selection */}
          <div className="px-5 mt-8 grid grid-cols-2 gap-4">
            <button 
              onClick={() => {setView('marketplace'); setActiveTab('marketplace');}}
              className="p-4 bg-green-50 rounded-3xl border border-green-100 flex flex-col items-center gap-3 hover:bg-green-100 transition-all text-left group"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShoppingBag size={32} className="text-green-600" />
              </div>
              <div className="text-center">
                <span className="font-bold text-gray-900 block">Marketplace</span>
                <span className="text-xs text-gray-500">Order anything</span>
              </div>
            </button>
            <button 
              onClick={() => setView('cefane')}
              className="p-4 bg-orange-50 rounded-3xl border border-orange-100 flex flex-col items-center gap-3 hover:bg-orange-100 transition-all text-left group"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                <ClipboardList size={32} className="text-orange-600" />
              </div>
              <div className="text-center">
                <span className="font-bold text-gray-900 block">Cefane Errand</span>
                <span className="text-xs text-gray-500">Personal shopper</span>
              </div>
            </button>
          </div>

          {/* Categories */}
          <div className="mt-8">
            <div className="px-5 flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Popular Categories</h2>
              <span className="text-green-600 font-semibold text-sm">See All</span>
            </div>
            <div className="flex overflow-x-auto px-5 gap-4 no-scrollbar">
              {['Restaurants', 'Supermarkets', 'Pharmacies', 'Retail'].map((cat, i) => (
                <div key={i} className="flex flex-col items-center flex-shrink-0 gap-2">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                    <img src={`https://picsum.photos/seed/${cat}/100/100`} alt={cat} className="object-cover w-full h-full" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{cat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Vendors */}
          <div className="mt-8 px-5">
            <h2 className="text-xl font-bold mb-4">Recommended for you</h2>
            <div className="space-y-6">
              {VENDORS.map(vendor => (
                <div key={vendor.id} onClick={() => {setSelectedVendorId(vendor.id); setView('vendor');}} className="cursor-pointer group">
                  <div className="relative rounded-3xl overflow-hidden aspect-[16/9] mb-3">
                    <img src={vendor.image} alt={vendor.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold">{vendor.rating}</span>
                    </div>
                    {!vendor.isOpen && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white px-4 py-2 rounded-xl font-bold text-gray-900">CLOSED</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{vendor.name}</h3>
                      <p className="text-gray-500 text-sm">{vendor.category} • ${vendor.deliveryFee} fee</p>
                    </div>
                    <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-700">
                      {vendor.deliveryTime}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Marketplace View */}
      {view === 'marketplace' && (
        <div className="animate-fadeIn">
          <div className="p-5 flex items-center gap-4 border-b">
            <button onClick={() => setView('home')}><ArrowLeft size={24} /></button>
            <h1 className="text-xl font-bold">All Stores</h1>
          </div>
          <div className="p-5 space-y-6">
            {VENDORS.map(vendor => (
              <div key={vendor.id} onClick={() => {setSelectedVendorId(vendor.id); setView('vendor');}} className="flex gap-4 items-center">
                <img src={vendor.image} className="w-20 h-20 rounded-2xl object-cover" />
                <div className="flex-1">
                  <h3 className="font-bold">{vendor.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span>{vendor.rating}</span>
                    <span>•</span>
                    <span>{vendor.deliveryTime}</span>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">Free Delivery</span>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendor Detail View */}
      {view === 'vendor' && currentVendor && (
        <div className="animate-fadeIn pb-24">
          <div className="relative h-64">
            <img src={currentVendor.image} className="w-full h-full object-cover" />
            <div className="absolute top-6 left-5 flex gap-2">
              <button onClick={() => setView('home')} className="p-2 bg-white rounded-full shadow-lg"><ArrowLeft size={24} /></button>
            </div>
          </div>
          <div className="p-5 -mt-8 bg-white rounded-t-3xl relative">
            <h1 className="text-2xl font-bold mb-1">{currentVendor.name}</h1>
            <p className="text-gray-500 text-sm mb-4">{currentVendor.category} • {currentVendor.deliveryTime} • {currentVendor.isOpen ? 'Open Now' : 'Closed'}</p>
            <div className="flex items-center gap-4 border-b pb-6 mb-6">
              <div className="flex flex-col items-center">
                <span className="font-bold">{currentVendor.rating}</span>
                <span className="text-[10px] text-gray-400">Ratings</span>
              </div>
              <div className="h-8 w-[1px] bg-gray-100"></div>
              <div className="flex flex-col items-center">
                <span className="font-bold">${currentVendor.deliveryFee}</span>
                <span className="text-[10px] text-gray-400">Delivery</span>
              </div>
            </div>

            <h2 className="text-lg font-bold mb-4">Menu / Products</h2>
            <div className="space-y-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="flex gap-4 items-center p-3 rounded-2xl hover:bg-gray-50">
                  <img src={product.image} className="w-20 h-20 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-xs text-gray-400 line-clamp-1">{product.description || 'Fresh and high quality.'}</p>
                    <span className="font-bold text-green-600 block mt-1">${product.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {cart.find(c => c.product.id === product.id) ? (
                      <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                        <button onClick={() => removeFromCart(product.id)} className="p-1 bg-white rounded-full shadow-sm"><Minus size={14} /></button>
                        <span className="font-bold text-sm">{cart.find(c => c.product.id === product.id)?.quantity}</span>
                        <button onClick={() => addToCart(product, currentVendor)} className="p-1 bg-green-600 text-white rounded-full shadow-sm"><Plus size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(product, currentVendor)} className="p-2 bg-green-600 text-white rounded-full shadow-md"><Plus size={20} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {cart.length > 0 && (
            <div className="fixed bottom-24 left-5 right-5 z-50">
              <button 
                onClick={() => setView('cart')}
                className="w-full bg-green-600 text-white p-4 rounded-2xl shadow-xl flex justify-between items-center animate-bounce-short"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 w-8 h-8 rounded-lg flex items-center justify-center font-bold">{cart.reduce((a,b) => a+b.quantity, 0)}</div>
                  <span className="font-bold">View Cart</span>
                </div>
                <span className="font-bold">${cartTotal.toFixed(2)}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cefane View */}
      {view === 'cefane' && (
        <div className="animate-fadeIn">
          <div className="p-5 flex items-center gap-4 border-b">
            <button onClick={editingOrderId ? cancelCefaneEdit : () => setView('home')}><ArrowLeft size={24} /></button>
            <h1 className="text-xl font-bold">{editingOrderId ? 'Edit Errand' : 'Cefane Shopping'}</h1>
          </div>
          <div className="p-5">
            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 mb-8">
              <h2 className="font-bold text-orange-800 mb-2">{editingOrderId ? 'Update Request' : 'E-Errand Service'}</h2>
              <p className="text-sm text-orange-600">
                {editingOrderId 
                  ? 'Update your details below. You can only edit before the request is accepted.'
                  : "Can't find what you need? We'll buy it for you! Tell us what to get and from where."
                }
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Address Selection Section */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Delivery Address</label>
                <div 
                  onClick={() => setShowAddressPicker(true)}
                  className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{currentAddress?.label}</h4>
                      <p className="text-xs text-gray-500 truncate w-48">{currentAddress?.details}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-orange-600">Change</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Your Shopping List</label>
                <textarea 
                  rows={4} 
                  placeholder="e.g. 2kg Apples, 1 Whole Chicken, 3 Loaves of bread from the bakery on 5th street..."
                  className="w-full p-4 bg-gray-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none border-none resize-none"
                  value={cefaneText}
                  onChange={(e) => setCefaneText(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
                
                {cefaneImage ? (
                  <div className="relative group w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden border-2 border-orange-500">
                    <img src={cefaneImage} alt="Captured List" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setCefaneImage(null)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-2xl gap-2 hover:border-orange-500 text-gray-400 hover:text-orange-500 transition-colors aspect-square"
                  >
                    <Camera size={24} />
                    <span className="text-xs font-medium">Capture List</span>
                  </button>
                )}
                
                <div className="flex flex-col justify-center gap-2">
                  <span className="text-sm font-bold">Options</span>
                  <p className="text-[10px] text-gray-400 leading-tight">Take a photo of your handwritten or printed list for faster service.</p>
                  <div className="flex items-center gap-2 text-orange-600">
                    <div className="w-1.5 h-1.5 bg-orange-600 rounded-full"></div>
                    <span className="text-[10px] font-bold">Fast Lane</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Budget Limit (Optional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">$</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full pl-8 pr-4 py-3 bg-gray-100 rounded-2xl border-none outline-none focus:ring-2 focus:ring-orange-500" 
                    value={cefaneBudget}
                    onChange={(e) => setCefaneBudget(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                {editingOrderId && (
                  <button 
                    onClick={cancelCefaneEdit}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  onClick={() => placeOrder('Cefane')}
                  disabled={!cefaneText && !cefaneImage}
                  className={`flex-[2] py-4 rounded-2xl font-bold shadow-lg transition-colors ${(!cefaneText && !cefaneImage) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
                >
                  {editingOrderId ? 'Update Request' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Address Picker Drawer/Modal */}
      {showAddressPicker && (
        <div className="fixed inset-0 z-[100] flex items-end animate-fadeIn">
          <div className="absolute inset-0 bg-black/50" onClick={() => {setShowAddressPicker(false); setIsAddingAddress(false);}}></div>
          <div className="relative w-full bg-white rounded-t-[40px] p-8 max-h-[85vh] overflow-y-auto animate-slideUp">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
            
            {isAddingAddress ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => setIsAddingAddress(false)} className="text-gray-400"><ArrowLeft size={24} /></button>
                  <h2 className="text-2xl font-bold">Add New Address</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Label</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Home, Office, Gym" 
                      className="w-full p-4 bg-gray-100 rounded-2xl border-none outline-none focus:ring-2 focus:ring-green-500"
                      value={newAddress.label}
                      onChange={e => setNewAddress({...newAddress, label: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Address Details</label>
                    <textarea 
                      rows={3}
                      placeholder="Street name, building number, apartment..." 
                      className="w-full p-4 bg-gray-100 rounded-2xl border-none outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      value={newAddress.details}
                      onChange={e => setNewAddress({...newAddress, details: e.target.value})}
                    />
                  </div>
                  <button 
                    onClick={handleAddAddress}
                    disabled={!newAddress.label || !newAddress.details}
                    className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-colors ${(!newAddress.label || !newAddress.details) ? 'bg-gray-200 text-gray-400' : 'bg-green-600 text-white hover:bg-green-700'}`}
                  >
                    Save Address
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold">Select Address</h2>
                  <button onClick={() => setIsAddingAddress(true)} className="text-green-600 font-bold flex items-center gap-1 text-sm">
                    <Plus size={16} /> Add New
                  </button>
                </div>
                <div className="space-y-3">
                  {addresses.map(addr => (
                    <div 
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        setShowAddressPicker(false);
                      }}
                      className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedAddressId === addr.id ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-green-200'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${selectedAddressId === addr.id ? 'bg-green-600 text-white' : 'bg-white text-gray-400'}`}>
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold">{addr.label}</h4>
                          <p className="text-xs text-gray-500">{addr.details}</p>
                        </div>
                      </div>
                      {selectedAddressId === addr.id && <Check size={20} className="text-green-600" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart/Checkout View */}
      {view === 'cart' && (
        <div className="animate-fadeIn">
          <div className="p-5 flex items-center gap-4 border-b">
            <button onClick={() => setView('vendor')}><ArrowLeft size={24} /></button>
            <h1 className="text-xl font-bold">Your Cart</h1>
          </div>
          <div className="p-5">
            {cart.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingCart size={64} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
                <button onClick={() => setView('home')} className="mt-4 text-green-600 font-bold">Start Shopping</button>
              </div>
            ) : (
              <>
                {/* Cart Address Picker */}
                <div className="mb-8 space-y-2">
                  <label className="block text-sm font-bold text-gray-700">Delivery Address</label>
                  <div 
                    onClick={() => setShowAddressPicker(true)}
                    className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-green-600" />
                      <div>
                        <h4 className="font-bold text-sm">{currentAddress?.label}</h4>
                        <p className="text-xs text-gray-400 truncate w-48">{currentAddress?.details}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between items-center">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          <img src={item.product.image} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-bold">{item.product.name}</h4>
                          <p className="text-xs text-gray-400">{item.vendor.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => removeFromCart(item.product.id)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full"><Minus size={14} /></button>
                        <span className="font-bold">{item.quantity}</span>
                        <button onClick={() => addToCart(item.product, item.vendor)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full"><Plus size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 p-6 rounded-3xl space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="font-medium">$5.00</span>
                  </div>
                  <div className="h-[1px] bg-gray-200"></div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-green-600">${(cartTotal + 5.0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold">Payment Method</h3>
                  <div className="p-4 bg-gray-100 rounded-2xl flex items-center justify-between border-2 border-green-500">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">💵</div>
                      <span className="font-bold">Cash on Delivery</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between text-gray-400">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm opacity-50">💳</div>
                      <span className="font-bold">Online Payment (Coming Soon)</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => placeOrder('Marketplace')}
                  className="w-full mt-10 py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg"
                >
                  Place Order
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tracking / Activity View */}
      {view === 'tracking' && (
        <div className="animate-fadeIn">
          <div className="p-5 flex items-center gap-4 border-b bg-white sticky top-0 z-10">
            <h1 className="text-xl font-bold">Activity & History</h1>
          </div>
          <div className="p-5 space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-20">
                <Clock size={64} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-500">No active orders yet</p>
              </div>
            ) : (
              orders.map(order => {
                const orderAddress = addresses.find(a => a.id === order.deliveryAddressId);
                return (
                  <div key={order.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${order.type === 'Cefane' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {order.type} Shopping
                        </span>
                        <h4 className="font-bold mt-2">Order #{order.id}</h4>
                        <p className="text-xs text-gray-400">{order.date}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-green-600 block">${order.total > 0 ? order.total.toFixed(2) : '---'}</span>
                        {order.budgetLimit && (
                          <span className="text-[10px] font-semibold text-orange-600 flex items-center justify-end gap-1">
                            <Wallet size={10} /> Budget: ${order.budgetLimit.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Stepper */}
                    <div className="flex items-center gap-2 mb-6 mt-4">
                      {[OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.IN_PROGRESS, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED].map((step, idx) => {
                        const isActive = order.status === step;
                        const orderSteps = [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.IN_PROGRESS, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED];
                        const currentIdx = orderSteps.indexOf(order.status);
                        const isCompleted = orderSteps.indexOf(step) <= currentIdx;
                        
                        return (
                          <React.Fragment key={step}>
                            <div className={`h-2 flex-1 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-100'}`}></div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center animate-pulse">
                          <Clock size={20} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{order.status}</p>
                          <p className="text-xs text-gray-400">Updated just now</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {order.type === 'Cefane' && order.status === OrderStatus.PENDING && (
                          <button 
                            onClick={() => handleEditCefaneOrder(order)}
                            className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-2 rounded-xl flex items-center gap-1"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                        )}
                        <button className="text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-xl">Details</button>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t flex flex-col gap-2">
                      {orderAddress && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin size={12} />
                          <span>Deliver to: <strong>{orderAddress.label}</strong> ({orderAddress.details})</span>
                        </div>
                      )}
                      {(order.receiptImage || order.shoppingList) && (
                        <div className="flex gap-3 items-center">
                          {order.receiptImage && <img src={order.receiptImage} className="w-8 h-8 rounded-lg object-cover border" />}
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-400 line-clamp-1 italic">
                              {order.shoppingList ? `"${order.shoppingList}"` : 'Image list attached'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Profile View */}
      {view === 'profile' && user && (
        <div className="animate-fadeIn px-5 py-8">
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 bg-gray-100 rounded-full mb-4 overflow-hidden border-4 border-white shadow-md relative">
              <img src="https://picsum.photos/seed/user/200/200" alt="Profile" className="w-full h-full object-cover" />
              <button className="absolute bottom-0 right-0 p-1.5 bg-green-600 rounded-full text-white border-2 border-white shadow-sm">
                <Camera size={14} />
              </button>
            </div>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>

          <div className="space-y-2">
            {[
              { icon: <MapPin size={20} />, label: 'Saved Addresses', detail: `${addresses.length} addresses`, onClick: () => setShowAddressPicker(true) },
              { icon: <ShoppingBag size={20} />, label: 'Order History', detail: `${orders.length} orders`, onClick: () => setView('tracking') },
              { icon: <Bell size={20} />, label: 'Notifications', detail: 'On' },
              { icon: <UserIcon size={20} />, label: 'Edit Profile', detail: '' },
            ].map((item, i) => (
              <button key={i} onClick={item.onClick} className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors text-left">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-500 shadow-sm">{item.icon}</div>
                  <span className="font-semibold">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium">{item.detail}</span>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
              </button>
            ))}

            <div className="pt-8">
              <button 
                onClick={() => {setUser(null); setView('auth');}}
                className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-100 hover:bg-red-100 transition-colors"
              >
                <LogOut size={20} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Nav */}
      {view !== 'auth' && <BottomNav />}
      
      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-bounce-short {
          animation: bounce-short 1s ease-in-out;
        }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default App;
