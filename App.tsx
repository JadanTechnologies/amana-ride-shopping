import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingBag, 
  User as UserIcon, 
  Home as HomeIcon, 
  Search, 
  ShoppingCart, 
  MapPin, 
  Clock, 
  Star, 
  ChevronRight, 
  MessageSquare,
  ArrowLeft,
  Package,
  CheckCircle2,
  Truck,
  LogOut,
  Plus,
  Minus,
  Send,
  Navigation,
  Info,
  AlertCircle,
  ClipboardList,
  Wallet,
  Phone,
  Receipt,
  ExternalLink
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { 
  AppView, 
  User, 
  Vendor, 
  Product, 
  CartItem, 
  Order, 
  OrderStatus 
} from './types';

// Declare Leaflet global
declare const L: any;

// Mock Data
const MOCK_VENDORS: Vendor[] = [
  { id: 'v1', name: 'Gourmet Burger Kitchen', category: 'Restaurants', rating: 4.8, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=250&fit=crop', isOpen: true, deliveryTime: '20-30 min', deliveryFee: 2.5 },
  { id: 'v2', name: 'Fresh Groceries Local', category: 'Supermarkets', rating: 4.5, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=250&fit=crop', isOpen: true, deliveryTime: '30-45 min', deliveryFee: 3.0 },
  { id: 'v3', name: 'WellCare Pharmacy', category: 'Pharmacies', rating: 4.9, image: 'https://images.unsplash.com/photo-1587854680352-936b22b91030?w=400&h=250&fit=crop', isOpen: true, deliveryTime: '15-25 min', deliveryFee: 1.5 },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', vendorId: 'v1', name: 'Classic Cheeseburger', price: 12.99, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop', available: true, description: 'Juicy beef patty with cheddar cheese and special sauce.' },
  { id: 'p2', vendorId: 'v1', name: 'Truffle Parmesan Fries', price: 5.99, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop', available: true, description: 'Crispy hand-cut fries with truffle oil and shaved parmesan.' },
  { id: 'p3', vendorId: 'v2', name: 'Organic Bananas', price: 2.49, image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=200&h=200&fit=crop', available: true, description: 'Bundle of 5-6 fresh organic bananas.' },
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('auth');
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [cefaneInput, setCefaneInput] = useState('');
  const [cefaneBudget, setCefaneBudget] = useState('');
  const [isProcessingCefane, setIsProcessingCefane] = useState(false);
  const [showCefaneConfirm, setShowCefaneConfirm] = useState(false);
  const [eta, setEta] = useState<number>(15);

  const activeOrder = useMemo(() => orders.find(o => o.id === activeOrderId) || null, [orders, activeOrderId]);
  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId) || null, [orders, selectedOrderId]);

  // Map Component Logic
  const MapContainer = ({ order, onProgressUpdate }: { order: Order, onProgressUpdate: (progress: number) => void }) => {
    const mapRef = useRef<any>(null);
    const riderMarkerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!containerRef.current || mapRef.current) return;

      const dest: [number, number] = [5.6148, -0.1731]; // User address
      const start: [number, number] = [5.6037, -0.1870]; // Rider start

      const map = L.map(containerRef.current, { zoomControl: false }).setView(start, 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      const destIcon = L.divIcon({
        html: `<div class="bg-green-600 p-2.5 rounded-full border-2 border-white shadow-xl text-white scale-110"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>`,
        className: '', iconSize: [36, 36], iconAnchor: [18, 36]
      });

      const riderIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 bg-orange-500/30 rounded-full animate-ping"></div>
            <div class="bg-orange-600 p-2.5 rounded-full border-2 border-white shadow-2xl text-white z-10 scale-125">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
            </div>
          </div>
        `,
        className: '', iconSize: [40, 40], iconAnchor: [20, 20]
      });

      L.marker(dest, { icon: destIcon }).addTo(map);
      riderMarkerRef.current = L.marker(start, { icon: riderIcon }).addTo(map);
      mapRef.current = map;

      // Simulate movement
      let progress = 0;
      const moveInterval = setInterval(() => {
        if (order.status !== OrderStatus.OUT_FOR_DELIVERY) return;
        progress += 0.005;
        if (progress >= 1) progress = 1;
        
        const lat = start[0] + (dest[0] - start[0]) * progress;
        const lng = start[1] + (dest[1] - start[1]) * progress;
        
        riderMarkerRef.current.setLatLng([lat, lng]);
        onProgressUpdate(progress);

        if (progress >= 1) clearInterval(moveInterval);
      }, 1000);

      return () => {
        clearInterval(moveInterval);
        map.remove();
        mapRef.current = null;
      };
    }, []);

    return <div ref={containerRef} className="w-full h-full" />;
  };

  const processCefaneRequest = async () => {
    if (!cefaneInput.trim()) return;
    setIsProcessingCefane(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `User request: "${cefaneInput}". Budget: ${cefaneBudget || 'Not specified'}. Just confirm you understand.`,
      });

      const newOrder: Order = {
        id: `cef_${Math.random().toString(36).substr(2, 9)}`,
        type: 'Cefane',
        status: OrderStatus.PENDING,
        date: new Date().toISOString(),
        total: 0,
        deliveryFee: 5.0, // Base errand fee
        shoppingList: cefaneInput,
        budgetLimit: cefaneBudget ? parseFloat(cefaneBudget) : undefined,
        deliveryAddress: "Main Street, Accra",
      };
      
      setOrders(prev => [newOrder, ...prev]);
      setActiveOrderId(newOrder.id);
      setEta(15); 
      setCefaneInput('');
      setCefaneBudget('');
      setShowCefaneConfirm(false);
      setView('tracking');
    } catch (error) {
      console.error("Cefane processing failed", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsProcessingCefane(false);
    }
  };

  const login = () => {
    setUser({ id: 'demo', name: 'Demo Customer', email: 'demo@amana.com', phone: '+233 24 000 0000' });
    setView('home');
  };

  const addToCart = (product: Product, vendor: Vendor) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, vendor }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const item = prev.find(i => i.product.id === productId);
      if (item && item.quantity > 1) {
        return prev.map(i => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.product.id !== productId);
    });
  };

  const handleCheckout = () => {
    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const newOrder: Order = {
      id: `ord_${Math.random().toString(36).substr(2, 9)}`,
      type: 'Marketplace',
      status: OrderStatus.PENDING,
      date: new Date().toISOString(),
      total: subtotal,
      deliveryFee: 2.5,
      items: [...cart],
      deliveryAddress: "Main Street, Accra",
      riderLocation: [5.6037, -0.1870]
    };
    setOrders(prev => [newOrder, ...prev]);
    setActiveOrderId(newOrder.id);
    setEta(20); 
    setCart([]);
    setView('tracking');
  };

  const simulateProgress = () => {
    if (!activeOrderId) return;
    setOrders(prev => prev.map(o => {
      if (o.id !== activeOrderId) return o;
      const statuses = Object.values(OrderStatus);
      const currentIndex = statuses.indexOf(o.status);
      if (currentIndex < statuses.length - 1) {
        return { ...o, status: statuses[currentIndex + 1] };
      }
      return o;
    }));
  };

  const handleProgressUpdate = (progress: number) => {
    const initialEta = activeOrder?.type === 'Cefane' ? 15 : 20;
    const remaining = Math.max(1, Math.round(initialEta * (1 - progress)));
    setEta(remaining);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 font-sans text-gray-900 shadow-2xl relative overflow-hidden flex flex-col">
      {/* Views */}
      {view === 'auth' && (
        <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl max-w-sm w-full border border-orange-100">
            <div className="w-24 h-24 bg-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl rotate-3">
              <ShoppingBag className="text-white w-12 h-12" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Amana Rides</h1>
            <p className="text-gray-500 mb-8 font-medium">Digital Marketplace & E-Errand</p>
            
            <div className="space-y-4">
              <button 
                onClick={login}
                className="w-full bg-orange-600 text-white font-bold py-5 rounded-2xl shadow-lg hover:bg-orange-700 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                Demo Login
              </button>
              
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 text-left">
                <Info className="text-blue-500 shrink-0 w-5 h-5" />
                <div className="text-xs">
                  <p className="font-bold text-blue-900 mb-1">Demo Credentials</p>
                  <p className="text-blue-700">Email: demo@amana.com</p>
                  <p className="text-blue-700">Phone: +233 24 000 0000</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'home' && (
        <div className="p-5 space-y-6 pb-24 overflow-y-auto">
          <header className="flex items-center justify-between">
            <div className="cursor-pointer">
              <h2 className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Delivering to</h2>
              <div className="flex items-center text-gray-900 font-bold">
                <MapPin className="w-4 h-4 text-orange-600 mr-1" />
                <span className="text-sm">Main Street, Accra</span>
                <ChevronRight className="w-3 h-3 ml-1 rotate-90" />
              </div>
            </div>
            <button onClick={() => setView('profile')} className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" className="w-full h-full object-cover" alt="" />
            </button>
          </header>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-orange-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Food, Groceries, Errands..." 
              className="w-full bg-white border border-gray-100 py-4 pl-12 pr-4 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            />
          </div>

          <div 
            onClick={() => setView('cefane')}
            className="bg-orange-600 rounded-[32px] p-7 text-white relative overflow-hidden shadow-2xl cursor-pointer group hover:scale-[1.01] transition-transform"
          >
            <div className="relative z-10">
              <div className="bg-orange-500/50 w-fit p-2 rounded-xl mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black mb-1">Cefane E-Errand</h3>
              <p className="text-orange-100 mb-5 text-sm max-w-[200px]">Describe anything, we'll buy and deliver it.</p>
              <span className="bg-white text-orange-600 font-bold px-6 py-2 rounded-full text-xs shadow-xl">Start Errand</span>
            </div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-orange-500/30 rounded-full blur-2xl group-hover:bg-orange-400/40 transition-colors" />
            <ClipboardList className="absolute top-10 right-5 w-24 h-24 text-white/10 -rotate-12" />
          </div>

          {activeOrder && activeOrder.status !== OrderStatus.DELIVERED && (
            <div 
              onClick={() => setView('tracking')}
              className="bg-white p-4 rounded-3xl border border-orange-100 shadow-sm flex items-center justify-between cursor-pointer animate-fadeIn"
            >
              <div className="flex items-center gap-4">
                <div className="bg-orange-50 p-2 rounded-xl">
                  <Truck className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-black text-sm">Active Order Tracking</h4>
                  <p className="text-xs text-gray-400">{activeOrder.status} • ETA: {eta} mins</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-orange-600" />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-xl text-gray-900 tracking-tight">Marketplace</h3>
              <span className="text-orange-600 font-bold text-xs">View All</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['Restaurants', 'Supermarkets', 'Pharmacies', 'Retail stores'].map((cat) => (
                <div 
                  key={cat}
                  onClick={() => setView('marketplace')}
                  className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 hover:border-orange-200 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {cat === 'Restaurants' && <Truck className="text-orange-600 w-6 h-6" />}
                    {cat === 'Supermarkets' && <ShoppingBag className="text-orange-600 w-6 h-6" />}
                    {cat === 'Pharmacies' && <AlertCircle className="text-orange-600 w-6 h-6" />}
                    {cat === 'Retail stores' && <Package className="text-orange-600 w-6 h-6" />}
                  </div>
                  <p className="font-black text-gray-800 text-sm tracking-tight">{cat}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Explore stores</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'cefane' && (
        <div className="p-5 flex flex-col h-full bg-white animate-fadeIn pb-24 overflow-y-auto">
          <div className="flex items-center mb-6">
            <button onClick={() => setView('home')} className="p-2 -ml-2 mr-2 bg-gray-50 rounded-xl"><ArrowLeft className="w-6 h-6" /></button>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Cefane Concierge</h2>
          </div>
          
          <div className="flex-1 flex flex-col space-y-6">
            <div className="bg-orange-50 p-6 rounded-[32px] border border-orange-100">
              <h3 className="text-xl font-bold text-orange-900 mb-2">What's on your list?</h3>
              <p className="text-orange-700/70 text-sm">Tell us the items, the store, and any specific preferences.</p>
            </div>

            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <MapPin className="text-orange-600 w-5 h-5" />
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Delivery To</p>
                <p className="text-sm font-bold text-gray-800">Main Street, Accra</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-2 block">Errand Details</label>
              <textarea 
                placeholder="e.g., 'Go to Melcom and get a large frying pan, then stop by the bakery for 2 loaves of wheat bread...'"
                className="w-full min-h-[160px] bg-gray-50 rounded-[32px] p-6 text-gray-800 placeholder:text-gray-300 focus:ring-4 focus:ring-orange-100 focus:outline-none resize-none border-none text-lg"
                value={cefaneInput}
                onChange={(e) => setCefaneInput(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-2 block">Optional Budget ($)</label>
              <div className="relative">
                <Wallet className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="number" 
                  placeholder="Enter max budget (e.g. 50)" 
                  className="w-full bg-gray-50 rounded-2xl py-4 pl-14 pr-4 border-none focus:ring-4 focus:ring-orange-100 outline-none font-bold"
                  value={cefaneBudget}
                  onChange={(e) => setCefaneBudget(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={() => setShowCefaneConfirm(true)}
              disabled={!cefaneInput.trim() || isProcessingCefane}
              className={`mt-6 w-full py-5 rounded-2xl font-black text-white shadow-2xl flex items-center justify-center gap-2 transition-all active:scale-95 ${!cefaneInput.trim() ? 'bg-gray-200' : 'bg-orange-600 hover:bg-orange-700'}`}
            >
              {isProcessingCefane ? "Processing..." : "Review Errand"} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {showCefaneConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full rounded-[48px] p-10 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="text-orange-600 w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black tracking-tight">Confirm Request</h3>
              <p className="text-gray-500 font-medium mt-1">Please verify your errand summary before we start shopping.</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <ClipboardList className="w-4 h-4 text-orange-600" />
                  <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Shopping List</h4>
                </div>
                <p className="text-gray-800 font-medium text-sm leading-relaxed whitespace-pre-wrap italic">"{cefaneInput}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-5 rounded-[28px] border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <Wallet className="w-4 h-4 text-green-600" />
                    <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Budget</h4>
                  </div>
                  <p className="text-gray-900 font-black">{cefaneBudget ? `$${parseFloat(cefaneBudget).toFixed(2)}` : 'No Limit'}</p>
                </div>
                <div className="bg-gray-50 p-5 rounded-[28px] border border-gray-100">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Address</h4>
                  </div>
                  <p className="text-gray-900 font-black text-xs truncate">Main Street, Accra</p>
                </div>
              </div>
              
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-800 font-medium leading-tight">Once confirmed, your errand will be sent to the Amana Rides Super Admin for fulfillment.</p>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3">
              <button 
                onClick={processCefaneRequest}
                disabled={isProcessingCefane}
                className="w-full py-5 bg-orange-600 text-white font-black rounded-3xl shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isProcessingCefane ? 'Sending...' : 'Confirm & Send Request'} <Send className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowCefaneConfirm(false)}
                className="w-full py-4 text-gray-400 font-black tracking-tight"
              >
                Go back & edit
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'tracking' && activeOrder && (
        <div className="h-full flex flex-col bg-white overflow-hidden">
          <div className="flex-1 relative">
            <MapContainer order={activeOrder} onProgressUpdate={handleProgressUpdate} />
            <button 
              onClick={() => setView('home')} 
              className="absolute top-6 left-6 bg-white p-4 rounded-2xl shadow-2xl z-20 border border-gray-100 active:scale-95"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            {activeOrder.status === OrderStatus.OUT_FOR_DELIVERY && (
              <div className="absolute top-6 right-6 bg-orange-600 text-white px-4 py-2 rounded-xl shadow-xl z-20 font-black text-xs animate-pulse">
                LIVE TRACKING
              </div>
            )}
          </div>

          <div className="bg-white rounded-t-[48px] -mt-10 relative z-30 p-8 shadow-[0_-20px_60px_rgba(0,0,0,0.15)] flex flex-col gap-6">
            <div className="w-16 h-1.5 bg-gray-100 rounded-full mx-auto" />
            
            {activeOrder.status === OrderStatus.OUT_FOR_DELIVERY ? (
              <div className="bg-orange-50 p-5 rounded-[32px] border border-orange-100 flex items-center gap-4 animate-fadeIn">
                <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop" className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md" alt="Rider" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-orange-900">Kofi Mensah</h4>
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg shadow-sm">
                      <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                      <span className="text-[10px] font-black">4.9</span>
                    </div>
                  </div>
                  <p className="text-orange-700/70 text-xs font-bold mt-0.5">Honda Super Cub • GW-402-23</p>
                  <div className="flex gap-2 mt-2">
                    <button className="bg-white p-2 rounded-xl shadow-sm text-orange-600 active:scale-90 transition-transform"><Phone className="w-4 h-4" /></button>
                    <button className="bg-white p-2 rounded-xl shadow-sm text-orange-600 active:scale-90 transition-transform"><MessageSquare className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black uppercase text-orange-600 tracking-widest bg-orange-50 px-3 py-1 rounded-lg">
                    {activeOrder.type} Errand
                  </span>
                  <h3 className="text-3xl font-black text-gray-900 mt-3 tracking-tight">{activeOrder.status}</h3>
                  <p className="text-gray-400 font-medium mt-1">Order ID: #{activeOrder.id.toUpperCase()}</p>
                </div>
                <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center shadow-inner">
                  <Navigation className="w-10 h-10 text-orange-600 animate-bounce-short" />
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                {Object.values(OrderStatus).map((status, idx) => {
                  const statuses = Object.values(OrderStatus);
                  const currentIdx = statuses.indexOf(activeOrder.status);
                  const isPast = idx <= currentIdx;
                  return <div key={status} className={`h-full flex-1 transition-all duration-700 ${isPast ? 'bg-orange-500' : 'bg-transparent'}`} />;
                })}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-gray-800">
                  {activeOrder.status === OrderStatus.DELIVERED ? "Enjoy your order!" : 
                   `Next: ${Object.values(OrderStatus)[Object.values(OrderStatus).indexOf(activeOrder.status) + 1] || 'Done'}`}
                </p>
                <div className="flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-xl shadow-lg">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{activeOrder.status === OrderStatus.DELIVERED ? 'Arrived' : `ETA: ${eta} mins`}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={simulateProgress}
                className="flex-1 bg-orange-50 text-orange-600 font-black py-4 rounded-2xl border border-orange-100 active:scale-95 transition-transform"
              >
                Simulate Next
              </button>
              <button 
                onClick={() => setView('home')}
                className="flex-1 bg-gray-900 text-white font-black py-4 rounded-2xl active:scale-95 transition-transform"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'orderHistory' && (
        <div className="p-6 pb-24 space-y-6 overflow-y-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('profile')} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black">Order History</h2>
          </div>
          
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <Clock className="w-20 h-20 mb-4" />
              <p className="font-bold">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div 
                  key={order.id} 
                  onClick={() => { setSelectedOrderId(order.id); setView('orderDetails'); }}
                  className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${order.type === 'Cefane' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                      {order.type === 'Cefane' ? <Package className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-black text-sm">{order.type} #{order.id.slice(-4).toUpperCase()}</h4>
                      <p className="text-[10px] text-gray-400 font-bold">{new Date(order.date).toLocaleDateString()}</p>
                      <div className="mt-1">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm">${(order.total + order.deliveryFee).toFixed(2)}</p>
                    <ChevronRight className="w-4 h-4 text-gray-300 ml-auto mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'orderDetails' && selectedOrder && (
        <div className="flex flex-col h-full bg-white animate-fadeIn overflow-y-auto pb-10">
          <div className="p-6 flex items-center justify-between border-b border-gray-50">
            <button onClick={() => setView('orderHistory')} className="p-2 bg-gray-50 rounded-xl">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-black tracking-tight">Order Details</h3>
            <div className="w-10" /> {/* Spacer */}
          </div>

          <div className="p-8 space-y-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Transaction ID</p>
                <h4 className="text-xl font-black">#{selectedOrder.id.toUpperCase()}</h4>
                <p className="text-sm text-gray-500 mt-1">{new Date(selectedOrder.date).toLocaleString()}</p>
              </div>
              <div className={`px-4 py-2 rounded-2xl font-black text-xs ${selectedOrder.status === OrderStatus.DELIVERED ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700 animate-pulse'}`}>
                {selectedOrder.status.toUpperCase()}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 space-y-4">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-600">
                   <MapPin className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Delivery Address</p>
                   <p className="text-sm font-bold text-gray-800">{selectedOrder.deliveryAddress}</p>
                 </div>
               </div>
            </div>

            <div>
              <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 ml-1">Order Summary</h5>
              <div className="space-y-4">
                {selectedOrder.type === 'Marketplace' && selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <img src={item.product.image} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{item.product.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-black text-sm">${(item.product.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
                
                {selectedOrder.type === 'Cefane' && (
                  <div className="p-5 bg-orange-50/50 rounded-3xl border border-orange-100/50">
                    <div className="flex items-center gap-3 mb-2">
                      <ClipboardList className="w-4 h-4 text-orange-600" />
                      <p className="text-xs font-black text-orange-900">Requested Errand</p>
                    </div>
                    <p className="text-sm text-orange-800/80 italic leading-relaxed whitespace-pre-wrap">"{selectedOrder.shoppingList}"</p>
                    {selectedOrder.budgetLimit && (
                       <p className="text-[10px] font-black mt-3 text-orange-700 uppercase tracking-widest">Budget Limit: ${selectedOrder.budgetLimit}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-3">
               <div className="flex justify-between items-center text-gray-400 text-sm font-bold">
                 <span>Subtotal</span>
                 <span>${selectedOrder.total.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-gray-400 text-sm font-bold">
                 <span>Delivery Fee</span>
                 <span>${selectedOrder.deliveryFee.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center pt-2">
                 <span className="text-lg font-black">Total Price</span>
                 <span className="text-2xl font-black text-orange-600">${(selectedOrder.total + selectedOrder.deliveryFee).toFixed(2)}</span>
               </div>
            </div>

            {selectedOrder.status !== OrderStatus.DELIVERED && (
               <button 
                 onClick={() => { setActiveOrderId(selectedOrder.id); setView('tracking'); }}
                 className="w-full py-5 bg-orange-600 text-white font-black rounded-3xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3"
               >
                 <Truck className="w-5 h-5" /> View Live Tracking
               </button>
            )}
          </div>
        </div>
      )}

      {/* Nav Bar */}
      {view !== 'auth' && view !== 'tracking' && view !== 'cefane' && view !== 'orderDetails' && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-2xl border-t border-gray-100 px-8 py-5 flex justify-between items-center z-50">
          <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1.5 ${view === 'home' ? 'text-orange-600' : 'text-gray-300'}`}>
            <HomeIcon className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
          </button>
          <button onClick={() => setView('marketplace')} className={`flex flex-col items-center gap-1.5 ${view === 'marketplace' ? 'text-orange-600' : 'text-gray-300'}`}>
            <Search className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Browse</span>
          </button>
          <button onClick={() => setView('cart')} className={`flex flex-col items-center gap-1.5 ${view === 'cart' ? 'text-orange-600' : 'text-gray-300'} relative`}>
            <ShoppingCart className="w-6 h-6" />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black">{cart.length}</span>}
            <span className="text-[10px] font-black uppercase tracking-tighter">Cart</span>
          </button>
          <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1.5 ${view === 'profile' || view === 'orderHistory' ? 'text-orange-600' : 'text-gray-300'}`}>
            <UserIcon className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-tighter">Profile</span>
          </button>
        </nav>
      )}

      {/* Re-implementing Marketplace and Vendor briefly for completeness */}
      {view === 'marketplace' && (
        <div className="p-5 pb-24 space-y-6 overflow-y-auto">
          <div className="flex items-center">
            <button onClick={() => setView('home')} className="mr-3"><ArrowLeft className="w-6 h-6" /></button>
            <h2 className="text-2xl font-black">All Vendors</h2>
          </div>
          {MOCK_VENDORS.map(v => (
             <div key={v.id} onClick={() => { setSelectedVendor(v); setView('vendor'); }} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer">
               <img src={v.image} className="w-full h-40 object-cover" alt="" />
               <div className="p-4 flex justify-between items-center">
                 <div>
                   <h4 className="font-bold">{v.name}</h4>
                   <p className="text-xs text-gray-400">{v.category} • {v.deliveryTime}</p>
                 </div>
                 <div className="bg-orange-50 p-2 rounded-xl text-orange-600 font-bold text-xs">★ {v.rating}</div>
               </div>
             </div>
          ))}
        </div>
      )}

      {view === 'vendor' && selectedVendor && (
        <div className="pb-24 overflow-y-auto">
          <div className="h-64 relative">
             <img src={selectedVendor.image} className="w-full h-full object-cover" alt="" />
             <button onClick={() => setView('marketplace')} className="absolute top-6 left-6 bg-white p-3 rounded-2xl shadow-xl"><ArrowLeft className="w-6 h-6" /></button>
          </div>
          <div className="bg-white rounded-t-[40px] -mt-10 relative p-8">
            <h2 className="text-3xl font-black mb-1">{selectedVendor.name}</h2>
            <p className="text-gray-400 mb-8">{selectedVendor.category} • Fast Delivery</p>
            <div className="space-y-4">
              {MOCK_PRODUCTS.filter(p => p.vendorId === selectedVendor.id).map(p => (
                <div key={p.id} className="flex gap-4 items-center bg-gray-50 p-4 rounded-3xl">
                  <img src={p.image} className="w-20 h-20 rounded-2xl object-cover" alt="" />
                  <div className="flex-1">
                    <h4 className="font-bold">{p.name}</h4>
                    <p className="text-orange-600 font-black">${p.price}</p>
                  </div>
                  <button onClick={() => addToCart(p, selectedVendor)} className="bg-orange-600 text-white p-3 rounded-2xl shadow-xl"><Plus className="w-6 h-6" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'profile' && user && (
        <div className="p-8 space-y-10 animate-fadeIn overflow-y-auto pb-24">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[32px] overflow-hidden shadow-xl border-4 border-white">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop" className="w-full h-full object-cover" alt="" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight">{user.name}</h2>
              <p className="text-gray-400 font-medium">{user.email}</p>
            </div>
          </div>

          <div className="space-y-3">
             <div 
               onClick={() => setView('orderHistory')}
               className="flex items-center justify-between p-5 bg-white rounded-3xl shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
             >
               <div className="flex items-center gap-4">
                 <div className="text-orange-500"><Clock /></div>
                 <span className="font-bold text-gray-800">Order History</span>
               </div>
               <span className="text-xs text-gray-300 font-bold">{orders.length} orders</span>
             </div>

             {[
               { icon: <MapPin />, label: "Saved Addresses", val: "1 saved" },
               { icon: <AlertCircle />, label: "Support", val: "24/7" },
             ].map((item, i) => (
               <div key={i} className="flex items-center justify-between p-5 bg-white rounded-3xl shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                 <div className="flex items-center gap-4">
                   <div className="text-orange-500">{item.icon}</div>
                   <span className="font-bold text-gray-800">{item.label}</span>
                 </div>
                 <span className="text-xs text-gray-300 font-bold">{item.val}</span>
               </div>
             ))}
          </div>

          <button 
            onClick={() => {setUser(null); setView('auth');}}
            className="w-full flex items-center justify-center gap-3 py-5 bg-red-50 text-red-600 font-black rounded-3xl border border-red-100 active:scale-95 transition-transform"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      )}

      {view === 'cart' && (
        <div className="p-5 flex flex-col h-full bg-white overflow-y-auto">
          <div className="flex items-center mb-6">
            <button onClick={() => setView('home')} className="mr-3"><ArrowLeft className="w-6 h-6" /></button>
            <h2 className="text-2xl font-black">My Cart</h2>
          </div>
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30">
              <ShoppingCart className="w-24 h-24 mb-4" />
              <p className="font-bold">Your cart is empty</p>
            </div>
          ) : (
            <div className="flex-1 space-y-4 pb-20">
               {cart.map(item => (
                 <div key={item.product.id} className="flex gap-4 p-4 bg-gray-50 rounded-3xl items-center">
                    <img src={item.product.image} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{item.product.name}</h4>
                      <p className="text-orange-600 font-black text-xs">${item.product.price}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm">
                      <button onClick={() => removeFromCart(item.product.id)}><Minus className="w-4 h-4" /></button>
                      <span className="font-black text-xs">{item.quantity}</span>
                      <button onClick={() => addToCart(item.product, item.vendor)}><Plus className="w-4 h-4" /></button>
                    </div>
                 </div>
               ))}
               <div className="mt-10 space-y-4">
                  <div className="flex justify-between font-bold text-gray-400"><span>Subtotal</span><span>${cart.reduce((a,b)=>a+(b.product.price*b.quantity),0).toFixed(2)}</span></div>
                  <div className="flex justify-between text-2xl font-black"><span>Total</span><span>${(cart.reduce((a,b)=>a+(b.product.price*b.quantity),0)+2.5).toFixed(2)}</span></div>
                  <button onClick={handleCheckout} className="w-full py-5 bg-orange-600 text-white font-black rounded-3xl shadow-2xl active:scale-95 transition-transform">Checkout</button>
               </div>
            </div>
          )}
        </div>
      )}

      {/* Global Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-bounce-short { animation: bounce-short 1s ease-in-out infinite; }
        @keyframes bounce-short { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .leaflet-container { font-family: inherit; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
