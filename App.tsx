import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Wallet, ChevronDown, User, DollarSign, LogOut, Settings as SettingsIcon, 
  TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownLeft, Shield, PauseCircle, CheckCircle, Trash2,
  ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';

import { StoreProvider, useStore } from './context/StoreContext';
import { Button, Modal, Input, Card, ToastContainer } from './components/UI';
import { Market, OrderType, Side, Outcome, OrderBookItem, MarketStatus, MarketCategory } from './types';

// ============================================================================
// Header Component
// ============================================================================
const Header = () => {
  const { user, connectWallet, disconnectWallet } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Risk Market
          </span>
        </Link>

        <div className="relative flex items-center gap-4">
          {!user.isConnected ? (
            <Button onClick={connectWallet} variant="primary" size="sm">
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          ) : (
            <>
               {/* Admin Button */}
               <Link to="/admin">
                <Button variant="secondary" size="sm" className="bg-slate-800 hover:bg-slate-700">
                    <Shield className="w-4 h-4 mr-1" /> Admin
                </Button>
               </Link>

               {/* Cash Display */}
               <Link to="/cash">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:border-blue-500/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer group">
                    <div className="bg-emerald-500/10 p-1 rounded">
                        <DollarSign className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-sm font-bold font-mono text-emerald-400 group-hover:text-emerald-300">
                        ${user.balance.toFixed(2)}
                    </span>
                </div>
               </Link>

               {/* User Menu */}
               <div className="relative">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 transition-colors"
                >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500"></div>
                    <span className="text-sm font-medium text-slate-200 hidden md:block">{user.address}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-surface border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                    <nav className="p-2">
                        <Link to="/portfolio" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-colors">
                        <TrendingUp className="w-4 h-4" /> Portfolio
                        </Link>
                        <Link to="/cash" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-colors">
                        <DollarSign className="w-4 h-4" /> Cash
                        </Link>
                        <Link to="/settings" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-colors">
                        <SettingsIcon className="w-4 h-4" /> Settings
                        </Link>
                        <div className="h-px bg-slate-700 my-1"></div>
                        <button 
                        onClick={() => { disconnectWallet(); setIsMenuOpen(false); navigate('/'); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                        >
                        <LogOut className="w-4 h-4" /> Disconnect
                        </button>
                    </nav>
                    </div>
                )}
               </div>
            </>
          )}
        </div>
      </div>
      {isMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
      )}
    </header>
  );
};

// ============================================================================
// Admin Page
// ============================================================================
const AdminPage = () => {
    const { markets, updateMarketStatus, user } = useStore();
    const [resolveModal, setResolveModal] = useState<string | null>(null);
    const [resolveOutcome, setResolveOutcome] = useState<Outcome>(Outcome.YES);
    const [resolveRef, setResolveRef] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!user.isConnected) navigate('/');
    }, [user.isConnected, navigate]);

    const handleResolve = () => {
        if (resolveModal) {
            updateMarketStatus(resolveModal, MarketStatus.RESOLVED, resolveOutcome, resolveRef);
            setResolveModal(null);
            setResolveRef('');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard - Market Management</h1>
            <Card className="overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 border-b border-slate-800">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Market</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {markets.map(m => (
                            <tr key={m.id} className="hover:bg-slate-800/20">
                                <td className="p-4 font-mono text-xs text-slate-500">{m.id}</td>
                                <td className="p-4 font-medium">{m.title}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs rounded font-bold ${
                                        m.status === MarketStatus.OPEN ? 'bg-emerald-500/20 text-emerald-400' :
                                        m.status === MarketStatus.PAUSED ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-slate-600/20 text-slate-400'
                                    }`}>
                                        {m.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    {m.status === MarketStatus.OPEN && (
                                        <Button size="sm" variant="secondary" onClick={() => updateMarketStatus(m.id, MarketStatus.PAUSED)}>
                                            <PauseCircle size={14} className="mr-1"/> Pause
                                        </Button>
                                    )}
                                    {m.status === MarketStatus.PAUSED && (
                                        <Button size="sm" variant="success" onClick={() => updateMarketStatus(m.id, MarketStatus.OPEN)}>
                                            <CheckCircle size={14} className="mr-1"/> Open
                                        </Button>
                                    )}
                                    {m.status !== MarketStatus.RESOLVED && (
                                        <Button size="sm" variant="danger" onClick={() => setResolveModal(m.id)}>
                                            Resolve
                                        </Button>
                                    )}
                                    {m.status === MarketStatus.RESOLVED && (
                                        <span className="text-xs text-slate-500">Resolved: {m.resolutionOutcome}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Modal isOpen={!!resolveModal} onClose={() => setResolveModal(null)} title="Resolve Market">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Outcome</label>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setResolveOutcome(Outcome.YES)}
                                className={`flex-1 py-2 rounded border ${resolveOutcome === Outcome.YES ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-700 bg-slate-900 text-slate-400'}`}
                            >
                                YES
                            </button>
                            <button 
                                onClick={() => setResolveOutcome(Outcome.NO)}
                                className={`flex-1 py-2 rounded border ${resolveOutcome === Outcome.NO ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'border-slate-700 bg-slate-900 text-slate-400'}`}
                            >
                                NO
                            </button>
                        </div>
                    </div>
                    <Input 
                        label="Reference URL / Note" 
                        value={resolveRef} 
                        onChange={e => setResolveRef(e.target.value)} 
                        placeholder="https://twitter.com/..."
                    />
                    <Button fullWidth variant="danger" onClick={handleResolve}>Confirm Resolution</Button>
                </div>
            </Modal>
        </div>
    );
};

// ============================================================================
// Pages
// ============================================================================

// --- Home Page ---
const HomePage = () => {
  const { markets } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'All'>('All');
  
  // Filter Logic
  const activeMarkets = markets.filter(m => m.status !== MarketStatus.RESOLVED);
  const displayedMarkets = selectedCategory === 'All' 
    ? activeMarkets 
    : activeMarkets.filter(m => m.category === selectedCategory);

  // Carousel Logic (Top 3 by Volume)
  const topMarkets = useMemo(() => {
    return [...activeMarkets].sort((a, b) => b.volume - a.volume).slice(0, 3);
  }, [activeMarkets]);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (topMarkets.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % topMarkets.length);
    }, 7000); // Auto-rotate every 7s (slower to allow reading)
    return () => clearInterval(interval);
  }, [topMarkets.length]);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % topMarkets.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + topMarkets.length) % topMarkets.length);

  // Categories for filter bar
  const categories: (MarketCategory | 'All')[] = ['All', 'Exchange', 'DeFi', 'Stablecoin'];

  // Helper to generate sparkline data for hero chart
  const getHeroChartData = (currentPrice: number) => {
    const data = [];
    let price = currentPrice * 0.9; // start slightly different
    for (let i = 0; i < 40; i++) {
        // Random walk towards currentPrice
        const noise = (Math.random() - 0.45) * 0.05;
        // drift towards current price
        const drift = (currentPrice - price) * 0.1;
        price = price + noise + drift;
        price = Math.max(0.01, Math.min(0.99, price));
        data.push({ time: i, price });
    }
    data.push({ time: 40, price: currentPrice });
    return data;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      
      {/* Category Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-slate-800 no-scrollbar">
         {categories.map(cat => (
             <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
             >
                 {cat}
             </button>
         ))}
      </div>

      {/* Featured Carousel (Hero Section) */}
      {topMarkets.length > 0 && selectedCategory === 'All' && (
        <div className="mb-12 relative group">
           <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-200">
             <TrendingUp className="text-emerald-400" size={20} /> Trending Markets
           </h2>
           
           <div className="relative bg-surface border border-slate-700 rounded-2xl overflow-hidden shadow-2xl h-[450px] md:h-[350px]">
              {/* Slide Content */}
              <div 
                 className="absolute inset-0 transition-transform duration-500 ease-in-out flex" 
                 style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                  {topMarkets.map((market) => {
                      const chartData = getHeroChartData(market.currentPrice);
                      const yesPercent = (market.currentPrice * 100).toFixed(0);
                      const noPercent = (100 - parseFloat(yesPercent)).toFixed(0);
                      
                      return (
                      <div key={market.id} className="min-w-full h-full flex flex-col md:flex-row">
                          
                          {/* Left Column: Info & Outcomes */}
                          <div className="w-full md:w-[45%] p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700 bg-slate-900/50 z-10">
                             <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <img src={market.image} alt={market.title} className="w-12 h-12 rounded-lg bg-slate-800 object-cover border border-slate-600" />
                                    <div>
                                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{market.category}</span>
                                        <h3 className="text-2xl font-bold text-white leading-tight line-clamp-2">{market.title}</h3>
                                    </div>
                                </div>
                                <p className="text-slate-400 text-sm mb-6 line-clamp-2">{market.description}</p>
                             </div>

                             <div className="space-y-3">
                                 {/* Outcome Row YES */}
                                 <Link to={`/market/${market.id}`} className="flex items-center justify-between p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 group/row">
                                     <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">YES</div>
                                         <span className="font-bold text-white group-hover/row:text-emerald-400 transition-colors">Bet Yes</span>
                                     </div>
                                     <span className="font-mono text-lg font-bold text-white">{yesPercent}%</span>
                                 </Link>
                                 
                                 {/* Outcome Row NO */}
                                 <Link to={`/market/${market.id}`} className="flex items-center justify-between p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 group/row">
                                     <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-xs">NO</div>
                                         <span className="font-bold text-white group-hover/row:text-rose-400 transition-colors">Bet No</span>
                                     </div>
                                     <span className="font-mono text-lg font-bold text-white">{noPercent}%</span>
                                 </Link>
                             </div>
                          </div>
                          
                          {/* Right Column: Chart */}
                          <div className="w-full md:w-[55%] relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
                              <div className="absolute top-6 right-8 text-right z-10">
                                  <div className="text-sm text-slate-400 font-bold uppercase mb-1">Chance of YES</div>
                                  <div className="text-5xl font-bold text-emerald-400 tracking-tight">{yesPercent}%</div>
                                  <div className="text-xs text-emerald-500/70 mt-1 font-mono">Vol: ${(market.volume / 1000).toFixed(1)}k</div>
                              </div>

                              <div className="absolute inset-0 pt-20 pb-4 px-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <XAxis dataKey="time" hide />
                                        <YAxis domain={[0, 1]} hide />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                                            formatter={(val: number) => [(val * 100).toFixed(1) + '%', 'Probability']}
                                            labelStyle={{ display: 'none' }}
                                        />
                                        <ReferenceLine y={0.5} stroke="#334155" strokeDasharray="3 3" />
                                        <Line 
                                            type="monotone" 
                                            dataKey="price" 
                                            stroke="#10b981" 
                                            strokeWidth={3} 
                                            dot={false}
                                            activeDot={{ r: 6, fill: '#10b981' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                              </div>
                          </div>
                      </div>
                  )})}
              </div>

              {/* Controls */}
              <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-600 shadow-lg backdrop-blur z-20 transition-all">
                  <ChevronLeft size={20} />
              </button>
              <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-600 shadow-lg backdrop-blur z-20 transition-all">
                  <ChevronRight size={20} />
              </button>
              
              {/* Dots */}
              <div className="absolute bottom-4 left-6 md:left-8 flex gap-2 z-20">
                  {topMarkets.map((_, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-blue-500 w-6' : 'bg-slate-600 hover:bg-slate-500'}`}
                      />
                  ))}
              </div>
           </div>
        </div>
      )}

      {/* Main Grid Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
             {selectedCategory === 'All' ? 'All Markets' : `${selectedCategory} Markets`}
          </h2>
          <p className="text-slate-400 text-sm">
             {displayedMarkets.length} active markets available
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedMarkets.map(market => (
          <Link key={market.id} to={`/market/${market.id}`} className="group">
            <Card className="h-full hover:border-blue-500/50 transition-colors cursor-pointer relative overflow-hidden flex flex-col">
               {market.status === MarketStatus.PAUSED && (
                   <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-sm">
                       <span className="bg-yellow-500 text-black font-bold px-4 py-2 rounded-full flex items-center">
                           <PauseCircle className="w-4 h-4 mr-2" /> PAUSED
                       </span>
                   </div>
               )}
               
               <div className="flex items-start gap-4 mb-2 flex-1">
                 <img src={market.image} alt={market.title} className="w-12 h-12 rounded-lg object-cover bg-slate-800 shrink-0" />
                 <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start gap-2">
                     <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 block">
                            {market.category}
                        </span>
                        <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors leading-tight line-clamp-2">
                            {market.title}
                        </h3>
                     </div>
                     <span className="text-xl font-mono font-bold text-emerald-400 shrink-0">
                        {(market.currentPrice * 100).toFixed(1)}%
                     </span>
                   </div>
                   <span className="text-xs text-slate-500 mt-1 block">Expires {format(new Date(market.expirationDate), 'MMM d, yyyy')}</span>
                 </div>
               </div>
               
               <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-sm text-slate-400">
                  <span>Vol: ${(market.volume / 1000).toFixed(1)}k</span>
                  <span className="flex items-center text-blue-400">Trade <ArrowUpRight size={14} className="ml-1"/></span>
               </div>
            </Card>
          </Link>
        ))}
      </div>
      
      {displayedMarkets.length === 0 && (
          <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No markets found in this category.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSelectedCategory('All')}>
                  Clear Filters
              </Button>
          </div>
      )}
    </div>
  );
};

// --- Market Page ---
const OrderBookRow: React.FC<{ item: OrderBookItem, type: 'bid' | 'ask', maxTotal: number }> = ({ item, type, maxTotal }) => {
  const widthPercent = (item.total / maxTotal) * 100;
  return (
    <div className="relative flex justify-between text-xs py-1 px-2 hover:bg-slate-800/50 cursor-pointer group">
      <div 
        className={`absolute top-0 ${type === 'bid' ? 'right-0 bg-emerald-500/10' : 'left-0 bg-rose-500/10'} bottom-0 transition-all duration-300`} 
        style={{ width: `${widthPercent}%` }}
      ></div>
      <span className={`relative z-10 font-mono ${type === 'bid' ? 'text-emerald-400' : 'text-rose-400'}`}>
        {item.price.toFixed(2)}
      </span>
      <span className="relative z-10 text-slate-300">{item.size.toLocaleString()}</span>
      <span className="relative z-10 text-slate-500">{item.total.toLocaleString()}</span>
    </div>
  );
};

const MarketPage = () => {
  const { id } = useParams();
  const { markets, user, placeOrder, deposit } = useStore();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<OrderType>(OrderType.MARKET);
  const [outcome, setOutcome] = useState<Outcome>(Outcome.YES);
  const [amount, setAmount] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [quickDepositAmount, setQuickDepositAmount] = useState('');
  
  // New state for Order Book Toggle
  const [orderBookView, setOrderBookView] = useState<Outcome>(Outcome.YES);
  
  const navigate = useNavigate();

  const market = markets.find(m => m.id === id);

  if (!market) return <div className="text-center py-20">Market not found</div>;

  const isTradeable = market.status === MarketStatus.OPEN;

  // Simple Mock Chart Data based on current price
  const chartData = useMemo(() => {
    const data = [];
    let price = market.currentPrice;
    for (let i = 0; i < 20; i++) {
      price = price + (Math.random() * 0.1 - 0.05);
      price = Math.max(0.01, Math.min(0.99, price));
      data.push({ time: i, price });
    }
    // ensure last point is current price
    data.push({ time: 20, price: market.currentPrice });
    return data;
  }, [market]);

  const maxTotalBids = market.bids[market.bids.length - 1]?.total || 1;
  const maxTotalAsks = market.asks[market.asks.length - 1]?.total || 1;

  // Order Book Data Logic (Mirrored Order Book)
  const orderBookData = useMemo(() => {
    if (orderBookView === Outcome.YES) {
        return {
            bids: market.bids, // Buy YES
            asks: market.asks, // Sell YES (Ascending)
            maxBids: maxTotalBids,
            maxAsks: maxTotalAsks
        };
    } else {
        // VIEW: NO
        // Logic: 
        // NO Bids (Buy NO) come from YES Asks (Sell YES). Price = 1 - p.
        // YES Asks are 0.51, 0.52... (Ascending). 
        // NO Bids become 0.49, 0.48... (Descending). This matches Bid structure.
        const bids = market.asks.map(item => ({
            ...item,
            price: 1 - item.price
        }));

        // NO Asks (Sell NO) come from YES Bids (Buy YES). Price = 1 - p.
        // YES Bids are 0.49, 0.48... (Descending).
        // NO Asks become 0.51, 0.52... (Ascending). This matches Ask structure.
        const asks = market.bids.map(item => ({
            ...item,
            price: 1 - item.price
        }));

        return {
            bids,
            asks,
            maxBids: maxTotalAsks, // Use total from source
            maxAsks: maxTotalBids
        };
    }
  }, [market, orderBookView, maxTotalBids, maxTotalAsks]);

  // Trading Logic
  const priceToExecute = orderType === OrderType.MARKET 
    ? (outcome === Outcome.YES ? market.currentPrice : 1 - market.currentPrice)
    : parseFloat(limitPrice);

  const estimatedCost = parseFloat(amount || '0') * priceToExecute;
  const estimatedPayout = parseFloat(amount || '0') * 1;

  const handleTrade = () => {
    if (!user.isConnected) {
      alert("Please connect wallet first");
      return;
    }

    const qty = parseFloat(amount);
    if (isNaN(qty) || qty <= 0) return;

    if (activeTab === 'buy') {
      if (estimatedCost > user.balance) {
        setQuickDepositAmount('');
        setShowDepositModal(true);
        return;
      }
      placeOrder(market.id, orderType, Side.BUY, outcome, qty, priceToExecute);
      setAmount('');
    } else {
      // Sell logic check
      const position = user.portfolio.find(p => p.marketId === market.id && p.outcome === outcome);
      if (!position || position.quantity < qty) {
        alert("Insufficient shares to sell.");
        return;
      }
      placeOrder(market.id, orderType, Side.SELL, outcome, qty, priceToExecute);
      setAmount('');
    }
  };

  const handleQuickDeposit = () => {
    const val = parseFloat(quickDepositAmount);
    if (isNaN(val) || val <= 0) return;
    deposit(val);
    setQuickDepositAmount('');
    setShowDepositModal(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Insufficient Funds Modal */}
      <Modal isOpen={showDepositModal} onClose={() => setShowDepositModal(false)} title="Insufficient Funds">
         <div className="space-y-4 pt-2">
           <div className="flex items-center gap-3 text-yellow-500 mb-2">
             <AlertTriangle className="w-6 h-6" />
             <p className="font-bold">Deposit Required</p>
           </div>
           <p className="text-sm text-slate-300">
             You need more USDC to place this trade. Deposit funds instantly to continue.
           </p>
           
           <Input 
             label="Amount to Deposit" 
             type="number" 
             placeholder="0.00" 
             value={quickDepositAmount} 
             onChange={(e) => setQuickDepositAmount(e.target.value)}
             autoFocus
           />

           <Button onClick={handleQuickDeposit} fullWidth variant="success" disabled={!quickDepositAmount || parseFloat(quickDepositAmount) <= 0}>
             Deposit {quickDepositAmount ? `$${quickDepositAmount}` : ''}
           </Button>
         </div>
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Chart & Info */}
        <div className="lg:col-span-2 space-y-6">
           <Card>
             <div className="flex items-start gap-4 mb-6">
                <img src={market.image} className="w-16 h-16 rounded-lg bg-slate-800" alt="logo"/>
                <div>
                   <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 border border-slate-700 px-2 py-0.5 rounded">
                        {market.category}
                    </span>
                    <h1 className="text-2xl font-bold text-white">{market.title}</h1>
                    {market.status !== MarketStatus.OPEN && (
                        <span className={`px-2 py-1 text-xs rounded font-bold ${
                            market.status === MarketStatus.PAUSED ? 'bg-yellow-500 text-black' : 'bg-purple-500 text-white'
                        }`}>
                            {market.status}
                        </span>
                    )}
                   </div>
                   <p className="text-slate-400 mt-2">{market.description}</p>
                </div>
             </div>
             
             <div className="h-64 w-full bg-slate-950/50 rounded-lg border border-slate-800 p-4 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 1]} hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                      formatter={(val: number) => [val.toFixed(2), 'Prob']}
                    />
                    <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
             </div>
             
             <div className="flex gap-4 text-sm">
                <div className="bg-slate-900 px-3 py-1 rounded border border-slate-800 text-slate-400">
                  Ends: <span className="text-white">{format(new Date(market.expirationDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="bg-slate-900 px-3 py-1 rounded border border-slate-800 text-slate-400">
                  Vol: <span className="text-white">${(market.volume/1000).toFixed(0)}k</span>
                </div>
             </div>
           </Card>

           <Card>
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Order Book</h3>
                {/* Order Book Toggle */}
                <div className="flex bg-slate-900 rounded-lg p-1">
                    <button
                        onClick={() => setOrderBookView(Outcome.YES)}
                        className={`px-3 py-1 text-xs font-bold rounded ${orderBookView === Outcome.YES ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        YES
                    </button>
                    <button
                        onClick={() => setOrderBookView(Outcome.NO)}
                        className={`px-3 py-1 text-xs font-bold rounded ${orderBookView === Outcome.NO ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        NO
                    </button>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-8">
               <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-2 px-2">
                    <span>Price</span><span>Size</span><span>Total</span>
                  </div>
                  <div className="space-y-0.5">
                    {/* Reverse asks to show lowest sell price at bottom (closest to spread) */}
                    {[...orderBookData.asks].reverse().slice(0, 10).map((ask, i) => (
                      <OrderBookRow key={i} item={ask} type="ask" maxTotal={orderBookData.maxAsks} />
                    ))}
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-2 px-2">
                    <span>Price</span><span>Size</span><span>Total</span>
                  </div>
                   <div className="space-y-0.5">
                    {orderBookData.bids.slice(0, 10).map((bid, i) => (
                      <OrderBookRow key={i} item={bid} type="bid" maxTotal={orderBookData.maxBids} />
                    ))}
                  </div>
               </div>
             </div>
           </Card>
        </div>

        {/* Right Column: Trade Interface */}
        <div className="space-y-6">
          <Card className="sticky top-24">
             {/* Buy/Sell Toggle */}
             <div className="flex bg-slate-900 p-1 rounded-lg mb-6">
               <button 
                 onClick={() => setActiveTab('buy')}
                 disabled={!isTradeable}
                 className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${!isTradeable ? 'opacity-50' : ''} ${activeTab === 'buy' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
               >
                 Buy
               </button>
               <button 
                 onClick={() => setActiveTab('sell')}
                 disabled={!isTradeable}
                 className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${!isTradeable ? 'opacity-50' : ''} ${activeTab === 'sell' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
               >
                 Sell
               </button>
             </div>

             {/* Outcome Toggle */}
             <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => setOutcome(Outcome.YES)}
                  disabled={!isTradeable}
                  className={`flex-1 py-3 border rounded-xl font-bold transition-all ${outcome === Outcome.YES ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-800 text-slate-400'} ${!isTradeable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  YES <span className="block text-xs font-normal opacity-70">{(market.currentPrice).toFixed(2)}</span>
                </button>
                <button 
                  onClick={() => setOutcome(Outcome.NO)}
                  disabled={!isTradeable}
                  className={`flex-1 py-3 border rounded-xl font-bold transition-all ${outcome === Outcome.NO ? 'border-rose-500 bg-rose-500/10 text-rose-400' : 'border-slate-700 bg-slate-800 text-slate-400'} ${!isTradeable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  NO <span className="block text-xs font-normal opacity-70">{(1 - market.currentPrice).toFixed(2)}</span>
                </button>
             </div>

             {/* Order Type */}
             <div className="flex gap-4 mb-4 text-sm">
               <label className="flex items-center gap-2 cursor-pointer">
                 <input disabled={!isTradeable} type="radio" checked={orderType === OrderType.MARKET} onChange={() => setOrderType(OrderType.MARKET)} className="accent-blue-500"/>
                 <span className={orderType === OrderType.MARKET ? 'text-white' : 'text-slate-500'}>Market</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                 <input disabled={!isTradeable} type="radio" checked={orderType === OrderType.LIMIT} onChange={() => setOrderType(OrderType.LIMIT)} className="accent-blue-500"/>
                 <span className={orderType === OrderType.LIMIT ? 'text-white' : 'text-slate-500'}>Limit</span>
               </label>
             </div>

             {/* Inputs */}
             <div className="space-y-4">
               {orderType === OrderType.LIMIT && (
                  <Input 
                    label="Limit Price" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="1" 
                    placeholder="0.50" 
                    disabled={!isTradeable}
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                  />
               )}
               <Input 
                 label="Shares Amount" 
                 type="number" 
                 placeholder="0.00" 
                 disabled={!isTradeable}
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
               />
               
               <div className="bg-slate-900 rounded-lg p-3 text-sm space-y-2 border border-slate-800">
                 <div className="flex justify-between items-center">
                    <span className="text-slate-400">Est. Cost</span>
                    <span className="font-mono text-white">${estimatedCost.toFixed(2)} USDC</span>
                 </div>
                 {activeTab === 'buy' && (
                     <div className="flex justify-between items-center text-emerald-400">
                        <span className="text-slate-400">Est. Payout (if win)</span>
                        <span className="font-mono font-bold">${estimatedPayout.toFixed(2)} USDC</span>
                     </div>
                 )}
               </div>
               
               {user.isConnected && (
                  <div className="text-xs text-right text-slate-500">
                    Balance: <span className="text-slate-300">${user.balance.toFixed(2)}</span>
                  </div>
               )}

               <Button 
                 fullWidth 
                 size="lg" 
                 variant={activeTab === 'buy' ? 'primary' : 'danger'}
                 onClick={handleTrade}
                 disabled={!amount || parseFloat(amount) <= 0 || !isTradeable}
               >
                 {!isTradeable ? 'Market Paused/Ended' : (activeTab === 'buy' ? 'Place Buy Order' : 'Place Sell Order')}
               </Button>
               
               {!user.isConnected && (
                 <p className="text-xs text-center text-yellow-500">Wallet not connected</p>
               )}
               {market.status !== MarketStatus.OPEN && (
                   <p className="text-xs text-center text-red-400">Trading is currently unavailable.</p>
               )}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// --- Cash Page ---
const CashPage = () => {
  const { user, deposit, withdraw } = useStore();
  const [activeModal, setActiveModal] = useState<'deposit' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleOpenModal = (type: 'deposit' | 'withdraw') => {
    setActiveModal(type);
    setAmount('');
    setError('');
  };

  const handleSubmit = () => {
    const val = parseFloat(amount);
    if (!amount || isNaN(val) || val <= 0) {
        setError('Please enter a valid amount');
        return;
    }

    if (activeModal === 'deposit') {
      deposit(val);
    } else {
      if (val > user.balance) {
        setError('Insufficient funds');
        return;
      }
      withdraw(val);
    }
    setAmount('');
    setError('');
    setActiveModal(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Cash & Transactions</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900">
          <p className="text-slate-400 mb-2">Available Balance</p>
          <div className="text-4xl font-bold text-white mb-6">${user.balance.toFixed(2)}</div>
          <div className="space-y-3">
            <Button fullWidth onClick={() => handleOpenModal('deposit')} variant="success">Deposit USDC</Button>
            <Button fullWidth onClick={() => handleOpenModal('withdraw')} variant="secondary">Withdraw</Button>
          </div>
        </Card>
        
        <div className="md:col-span-2">
          <Card className="h-full">
            <h3 className="font-bold mb-4">Transaction History</h3>
            <div className="overflow-y-auto max-h-[250px] pr-2">
              {user.transactions.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No transactions yet.</p>
              ) : (
                <div className="space-y-3">
                  {user.transactions.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${tx.type === 'DEPOSIT' || tx.type === 'REDEEM' ? 'bg-emerald-500/20 text-emerald-400' : tx.type === 'WITHDRAW' ? 'bg-slate-700 text-slate-300' : 'bg-blue-500/20 text-blue-400'}`}>
                           {tx.type === 'DEPOSIT' || tx.type === 'REDEEM' ? <ArrowDownLeft size={16}/> : tx.type === 'WITHDRAW' ? <ArrowUpRight size={16}/> : <TrendingUp size={16}/>}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{tx.description}</p>
                          <p className="text-xs text-slate-500">{format(tx.timestamp, 'MMM d, HH:mm')}</p>
                        </div>
                      </div>
                      <span className={`font-mono font-bold ${tx.type === 'DEPOSIT' || tx.type === 'TRADE_SELL' || tx.type === 'REDEEM' || tx.type === 'CANCEL_ORDER' ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {tx.type === 'DEPOSIT' || tx.type === 'TRADE_SELL' || tx.type === 'REDEEM' || tx.type === 'CANCEL_ORDER' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={!!activeModal} onClose={() => setActiveModal(null)} title={`${activeModal === 'deposit' ? 'Deposit' : 'Withdraw'} USDC`}>
         <div className="space-y-4">
           <Input 
             label="Amount" 
             type="number" 
             placeholder="0.00" 
             value={amount}
             onChange={(e) => {
                 setAmount(e.target.value);
                 if (error) setError('');
             }}
             autoFocus
             error={error}
           />
           {activeModal === 'withdraw' && (
             <p className="text-xs text-right text-slate-400">Available: ${user.balance.toFixed(2)}</p>
           )}
           <Button fullWidth onClick={handleSubmit}>
             Confirm {activeModal === 'deposit' ? 'Deposit' : 'Withdrawal'}
           </Button>
         </div>
      </Modal>
    </div>
  );
};

// --- Portfolio Page ---
const PortfolioPage = () => {
  const { user, markets, cancelOrder, redeemWinning } = useStore();

  const portfolioWithData = user.portfolio.map(pos => {
    const market = markets.find(m => m.id === pos.marketId);
    const currentPrice = market ? market.currentPrice : 0;
    // If holding YES, current value is price. If holding NO, current value is 1 - price.
    const currentValuePerShare = pos.outcome === Outcome.YES ? currentPrice : (1 - currentPrice);
    const totalValue = pos.quantity * currentValuePerShare;
    const costBasis = pos.quantity * pos.averageEntryPrice;
    const pnl = totalValue - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

    return {
      ...pos,
      currentValuePerShare,
      totalValue,
      pnl,
      pnlPercent,
      isResolved: market?.status === MarketStatus.RESOLVED,
      resolutionOutcome: market?.resolutionOutcome
    };
  });

  const totalPortfolioValue = portfolioWithData.reduce((acc, curr) => acc + curr.totalValue, 0);
  const totalPnl = portfolioWithData.reduce((acc, curr) => acc + curr.pnl, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Portfolio</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-800">
           <p className="text-slate-400 text-sm">Total Value</p>
           <p className="text-3xl font-bold text-white">${totalPortfolioValue.toFixed(2)}</p>
        </Card>
        <Card className="bg-slate-900/50">
           <p className="text-slate-400 text-sm">Unrealized PnL</p>
           <p className={`text-3xl font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
             {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
           </p>
        </Card>
      </div>

      <div className="space-y-8">
        {/* Positions */}
        <Card>
            <h2 className="text-xl font-bold mb-4">Active Positions</h2>
            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-sm">
                    <th className="pb-4">Market</th>
                    <th className="pb-4">Outcome</th>
                    <th className="pb-4 text-right">Shares</th>
                    <th className="pb-4 text-right">Avg Price</th>
                    <th className="pb-4 text-right">Cur Price</th>
                    <th className="pb-4 text-right">Value</th>
                    <th className="pb-4 text-right">PnL</th>
                    <th className="pb-4 text-right">Action</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                {portfolioWithData.length === 0 ? (
                    <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">No active positions.</td>
                    </tr>
                ) : (
                    portfolioWithData.map((pos, idx) => (
                    <tr key={idx} className="group hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 font-medium text-white max-w-[200px] truncate pr-4">
                        <Link to={`/market/${pos.marketId}`} className="hover:text-blue-400">{pos.marketTitle}</Link>
                        </td>
                        <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${pos.outcome === Outcome.YES ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {pos.outcome}
                        </span>
                        </td>
                        <td className="py-4 text-right text-slate-300">{pos.quantity.toLocaleString()}</td>
                        <td className="py-4 text-right text-slate-400">${pos.averageEntryPrice.toFixed(2)}</td>
                        <td className="py-4 text-right text-slate-300">${pos.currentValuePerShare.toFixed(2)}</td>
                        <td className="py-4 text-right text-white font-medium">${pos.totalValue.toFixed(2)}</td>
                        <td className={`py-4 text-right font-medium ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)} ({pos.pnlPercent.toFixed(1)}%)
                        </td>
                        <td className="py-4 text-right">
                            {pos.isResolved ? (
                                <Button size="sm" variant="success" onClick={() => redeemWinning(pos.marketId)}>Redeem</Button>
                            ) : (
                                <span className="text-slate-600 text-xs">Open</span>
                            )}
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
        </Card>
        
        {/* Open Orders */}
        <Card>
            <h2 className="text-xl font-bold mb-4">Open Limit Orders</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-800 text-slate-500 text-sm">
                            <th className="pb-4">Market</th>
                            <th className="pb-4">Type</th>
                            <th className="pb-4">Outcome</th>
                            <th className="pb-4 text-right">Price</th>
                            <th className="pb-4 text-right">Qty</th>
                            <th className="pb-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {user.openOrders.length === 0 ? (
                            <tr><td colSpan={6} className="py-8 text-center text-slate-500">No open orders.</td></tr>
                        ) : (
                            user.openOrders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-800/30">
                                    <td className="py-4 text-white">{order.marketTitle}</td>
                                    <td className="py-4 text-slate-400">{order.side}</td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${order.outcome === Outcome.YES ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                            {order.outcome}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right font-mono">${order.price.toFixed(2)}</td>
                                    <td className="py-4 text-right text-slate-300">{order.quantity}</td>
                                    <td className="py-4 text-right">
                                        <button 
                                            onClick={() => cancelOrder(order.id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>
    </div>
  );
};

// --- Settings Page (Mock) ---
const SettingsPage = () => (
  <div className="container mx-auto px-4 py-8 max-w-2xl">
    <h1 className="text-3xl font-bold mb-8">Settings</h1>
    <Card className="space-y-6 opacity-75 grayscale pointer-events-none">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-slate-700"></div>
        <Button variant="outline" size="sm">Change Avatar</Button>
      </div>
      <Input label="Display Name" defaultValue="Trader_0x71" />
      <Input label="Email Notification" defaultValue="trader@web3.com" />
      <Button disabled>Save Changes</Button>
    </Card>
    <p className="mt-4 text-center text-yellow-600">Settings are disabled in prototype mode.</p>
  </div>
);

// ============================================================================
// Main App Component
// ============================================================================
export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </StoreProvider>
  );
}

// Separated Content to use Store Hook for Toast Container
const AppContent = () => {
  const { toasts, removeToast } = useStore();
  
  return (
    <div className="min-h-screen bg-background text-slate-200 flex flex-col font-sans selection:bg-blue-500/30">
        <Header />
        <main className="flex-grow">
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/market/:id" element={<MarketPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/cash" element={<CashPage />} />
            <Route path="/settings" element={<SettingsPage />} />
        </Routes>
        </main>
        <footer className="py-6 border-t border-slate-800 text-center text-slate-600 text-sm">
            <p>&copy; 2024 Risk Market. Protocol Risks Prediction Market.</p>
        </footer>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}