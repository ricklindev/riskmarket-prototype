import { Market, OrderBookItem, MarketStatus, MarketCategory } from '../types';

const generateOrderBook = (currentPrice: number): { bids: OrderBookItem[], asks: OrderBookItem[] } => {
  const bids: OrderBookItem[] = [];
  const asks: OrderBookItem[] = [];
  
  // Generate Bids (Buy YES) - prices below currentPrice
  let totalBidSize = 0;
  for (let i = 1; i <= 15; i++) {
    const spread = i * 0.01 + (Math.random() * 0.01);
    const price = Math.max(0.01, currentPrice - spread);
    // Deeper liquidity near the money
    const depthFactor = 1 / (i * 0.5); 
    const size = Math.floor(Math.random() * 1000 * depthFactor) + 50;
    totalBidSize += size;
    bids.push({ price, size, total: totalBidSize });
  }

  // Generate Asks (Sell YES) - prices above currentPrice
  let totalAskSize = 0;
  for (let i = 1; i <= 15; i++) {
    const spread = i * 0.01 + (Math.random() * 0.01);
    const price = Math.min(0.99, currentPrice + spread);
    const depthFactor = 1 / (i * 0.5);
    const size = Math.floor(Math.random() * 1000 * depthFactor) + 50;
    totalAskSize += size;
    asks.push({ price, size, total: totalAskSize });
  }

  return { bids, asks };
};

export const generateMarkets = (): Market[] => {
  const marketTemplates: {
      id: string;
      category: MarketCategory;
      title: string;
      description: string;
      image: string;
  }[] = [
    // --- Exchange Insolvency Markets ---
    {
      id: 'ex-1',
      category: 'Exchange',
      title: 'HTX Insolvency / Withdrawal Halt?',
      description: 'Will HTX (formerly Huobi) halt withdrawals for > 7 days (168h) or force asset conversion before Dec 31, 2024?',
      image: 'https://picsum.photos/400/400?random=10'
    },
    {
      id: 'ex-2',
      category: 'Exchange',
      title: 'Bybit Insolvency / Withdrawal Halt?',
      description: 'Will Bybit halt withdrawals for > 7 days (168h) or force asset conversion to non-native tokens before Dec 31, 2024?',
      image: 'https://picsum.photos/400/400?random=11'
    },
    {
      id: 'ex-3',
      category: 'Exchange',
      title: 'Kraken Insolvency / Withdrawal Halt?',
      description: 'Will Kraken halt withdrawals for > 7 days (168h) or force asset conversion before Dec 31, 2024?',
      image: 'https://picsum.photos/400/400?random=12'
    },

    // --- DeFi Liquidity Crisis Markets ---
    {
      id: 'defi-1',
      category: 'DeFi',
      title: 'Curve Finance Liquidity Crisis?',
      description: 'Will Curve contracts be paused > 7 days or experience > 95% utilization preventing withdrawals for > 7 days?',
      image: 'https://picsum.photos/400/400?random=13'
    },
    {
      id: 'defi-2',
      category: 'DeFi',
      title: 'Ethena (USDe) Redemption Failure?',
      description: 'Will Ethena suspend USDe redemptions > 7 days or suffer critical liquidity failure (Utilization > 95%) > 7 days?',
      image: 'https://picsum.photos/400/400?random=14'
    },
    {
      id: 'defi-3',
      category: 'DeFi',
      title: 'Aave V3 Liquidity Freeze?',
      description: 'Will Aave V3 (Mainnet) markets be paused > 7 days or hit > 95% utilization preventing withdrawals for > 7 days?',
      image: 'https://picsum.photos/400/400?random=15'
    },

    // --- Stablecoin De-peg Markets ---
    {
      id: 'stable-1',
      category: 'Stablecoin',
      title: 'USDT De-peg < $0.90?',
      description: 'Will USDT trade below $0.90 USD for more than 24 consecutive hours according to major oracles?',
      image: 'https://picsum.photos/400/400?random=16'
    },
    {
      id: 'stable-2',
      category: 'Stablecoin',
      title: 'USDe De-peg < $0.90?',
      description: 'Will USDe trade below $0.90 USD for more than 24 consecutive hours in 2024?',
      image: 'https://picsum.photos/400/400?random=17'
    },
    {
      id: 'stable-3',
      category: 'Stablecoin',
      title: 'FDUSD De-peg < $0.90?',
      description: 'Will FDUSD trade below $0.90 USD for more than 24 consecutive hours in 2024?',
      image: 'https://picsum.photos/400/400?random=18'
    }
  ];

  return marketTemplates.map(tmpl => {
    // Generate random probabilities based on perceived risk
    let basePrice = 0.05; // Default low probability
    
    // Adjust base probability based on "riskiness"
    if (tmpl.title.includes('HTX')) basePrice = 0.25;
    if (tmpl.title.includes('USDe')) basePrice = 0.20;
    if (tmpl.title.includes('Curve')) basePrice = 0.15;
    if (tmpl.title.includes('USDT')) basePrice = 0.08;

    const price = basePrice + (Math.random() * 0.1); // Add some noise
    const { bids, asks } = generateOrderBook(price);
    
    return {
      ...tmpl,
      expirationDate: '2024-12-31T23:59:59Z',
      volume: Math.floor(Math.random() * 5000000) + 500000,
      currentPrice: price,
      bids,
      asks,
      status: MarketStatus.OPEN
    };
  });
};