import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserState, Market, Transaction, Position, Outcome, MarketStatus, OpenOrder, ToastMessage, OrderType, Side } from '../types';
import { generateMarkets } from '../services/mockData';

interface StoreContextType {
  user: UserState;
  markets: Market[];
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
  connectWallet: () => void;
  disconnectWallet: () => void;
  deposit: (amount: number) => void;
  withdraw: (amount: number) => void;
  placeOrder: (marketId: string, type: OrderType, side: Side, outcome: Outcome, amount: number, price: number) => void;
  cancelOrder: (orderId: string) => void;
  redeemWinning: (marketId: string) => void;
  // Admin Actions
  updateMarketStatus: (marketId: string, status: MarketStatus, resolutionOutcome?: Outcome, resolutionReference?: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [user, setUser] = useState<UserState>({
    isConnected: false,
    balance: 0,
    address: null,
    portfolio: [],
    openOrders: [],
    transactions: []
  });

  useEffect(() => {
    setMarkets(generateMarkets());
  }, []);

  // --- Toasts ---
  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Wallet ---
  const connectWallet = () => {
    setUser(prev => ({
      ...prev,
      isConnected: true,
      address: '0x71C...9A21'
    }));
    addToast('success', 'Wallet Connected');
  };

  const disconnectWallet = () => {
    setUser(prev => ({
      ...prev,
      isConnected: false,
      address: null
    }));
    addToast('info', 'Wallet Disconnected');
  };

  // --- Cash ---
  const deposit = (amount: number) => {
    setUser(prev => ({
      ...prev,
      balance: prev.balance + amount,
      transactions: [
        {
          id: Date.now().toString(),
          type: 'DEPOSIT',
          amount,
          timestamp: Date.now(),
          description: `Deposited ${amount} USDC`
        },
        ...prev.transactions
      ]
    }));
    addToast('success', `Successfully deposited $${amount}`);
  };

  const withdraw = (amount: number) => {
    if (user.balance < amount) {
        addToast('error', 'Insufficient funds for withdrawal');
        return;
    }
    setUser(prev => ({
      ...prev,
      balance: prev.balance - amount,
      transactions: [
        {
          id: Date.now().toString(),
          type: 'WITHDRAW',
          amount,
          timestamp: Date.now(),
          description: `Withdrew ${amount} USDC`
        },
        ...prev.transactions
      ]
    }));
    addToast('success', `Successfully withdrew $${amount}`);
  };

  // --- Trading ---
  const placeOrder = (marketId: string, type: OrderType, side: Side, outcome: Outcome, shares: number, price: number) => {
    const cost = shares * price;
    const market = markets.find(m => m.id === marketId);
    
    if (!market) return;
    if (market.status !== MarketStatus.OPEN) {
      addToast('error', 'Market is not open for trading');
      return;
    }

    if (type === OrderType.LIMIT) {
        // Handle Limit Order
        if (side === Side.BUY) {
            if (user.balance < cost) {
                addToast('error', 'Insufficient funds for limit order');
                return;
            }
            setUser(prev => ({
                ...prev,
                balance: prev.balance - cost,
                openOrders: [
                    ...prev.openOrders,
                    {
                        id: 'ord-' + Date.now(),
                        marketId,
                        marketTitle: market.title,
                        side,
                        outcome,
                        price,
                        quantity: shares,
                        timestamp: Date.now()
                    }
                ]
            }));
            addToast('success', 'Limit Order Placed');
        } else {
             // Limit Sell not fully implemented in this prototype's logic depth, treating as error or same as buy
             addToast('info', 'Limit Sell orders not available in prototype');
        }
        return;
    }

    // Market Order Logic (Simplified execution)
    if (side === Side.BUY) {
       if (user.balance < cost) {
          // Toast handled by UI modal usually, but safety check
           addToast('error', 'Insufficient funds');
           return;
       }

       setUser(prev => {
         const existingPosIndex = prev.portfolio.findIndex(p => p.marketId === marketId && p.outcome === outcome);
         let newPortfolio = [...prev.portfolio];
         
         if (existingPosIndex >= 0) {
            const oldPos = newPortfolio[existingPosIndex];
            const totalCost = (oldPos.quantity * oldPos.averageEntryPrice) + cost;
            const newQty = oldPos.quantity + shares;
            newPortfolio[existingPosIndex] = {
              ...oldPos,
              quantity: newQty,
              averageEntryPrice: totalCost / newQty
            };
         } else {
           newPortfolio.push({
             marketId,
             marketTitle: market?.title || 'Unknown',
             outcome,
             quantity: shares,
             averageEntryPrice: price
           });
         }

         return {
           ...prev,
           balance: prev.balance - cost,
           portfolio: newPortfolio,
           transactions: [
             {
               id: Date.now().toString(),
               type: 'TRADE_BUY',
               amount: cost,
               timestamp: Date.now(),
               description: `Bought ${shares} ${outcome} shares of ${market?.title}`
             },
             ...prev.transactions
           ]
         };
       });
       addToast('success', `Bought ${shares} shares of ${outcome}`);
    } else {
      // SELL Logic
       const existingPos = user.portfolio.find(p => p.marketId === marketId && p.outcome === outcome);
       if (!existingPos || existingPos.quantity < shares) {
           addToast('error', 'Insufficient shares to sell');
           return;
       }

       setUser(prev => {
         const existingPosIndex = prev.portfolio.findIndex(p => p.marketId === marketId && p.outcome === outcome);
         let newPortfolio = [...prev.portfolio];
         const oldPos = newPortfolio[existingPosIndex];
         const newQty = oldPos.quantity - shares;

         if (newQty <= 0) {
           newPortfolio.splice(existingPosIndex, 1);
         } else {
           newPortfolio[existingPosIndex] = { ...oldPos, quantity: newQty };
         }

         return {
           ...prev,
           balance: prev.balance + cost,
           portfolio: newPortfolio,
            transactions: [
             {
               id: Date.now().toString(),
               type: 'TRADE_SELL',
               amount: cost,
               timestamp: Date.now(),
               description: `Sold ${shares} ${outcome} shares of ${market?.title}`
             },
             ...prev.transactions
           ]
         };
       });
       addToast('success', `Sold ${shares} shares of ${outcome}`);
    }
  };

  const cancelOrder = (orderId: string) => {
      const order = user.openOrders.find(o => o.id === orderId);
      if (!order) return;

      setUser(prev => ({
          ...prev,
          balance: prev.balance + (order.quantity * order.price), // Refund
          openOrders: prev.openOrders.filter(o => o.id !== orderId),
          transactions: [
              {
                  id: Date.now().toString(),
                  type: 'CANCEL_ORDER',
                  amount: order.quantity * order.price,
                  timestamp: Date.now(),
                  description: `Cancelled Limit Order for ${order.marketTitle}`
              },
              ...prev.transactions
          ]
      }));
      addToast('success', 'Order Cancelled');
  };

  // --- Admin ---
  const updateMarketStatus = (marketId: string, status: MarketStatus, resolutionOutcome?: Outcome, resolutionReference?: string) => {
    setMarkets(prev => prev.map(m => {
        if (m.id === marketId) {
            return {
                ...m,
                status,
                resolutionOutcome,
                resolutionReference
            };
        }
        return m;
    }));
    const action = status === MarketStatus.PAUSED ? 'Paused' : status === MarketStatus.RESOLVED ? 'Resolved' : 'Opened';
    addToast('info', `Market ${action}`);
  };

  const redeemWinning = (marketId: string) => {
      const market = markets.find(m => m.id === marketId);
      if (!market || market.status !== MarketStatus.RESOLVED || !market.resolutionOutcome) {
          addToast('error', 'Market not resolvable');
          return;
      }

      setUser(prev => {
          let payout = 0;
          let newPortfolio = [];
          let redeemedAmount = 0;

          // Process portfolio
          for (const pos of prev.portfolio) {
              if (pos.marketId === marketId) {
                  // Check if position matches outcome
                  if (pos.outcome === market.resolutionOutcome) {
                      // Winner: $1.00 per share
                      redeemedAmount = pos.quantity * 1.00;
                      payout += redeemedAmount;
                  }
                  // Loser: $0.00 (Implicitly removed from portfolio)
              } else {
                  newPortfolio.push(pos);
              }
          }

          if (payout === 0 && prev.portfolio.some(p => p.marketId === marketId)) {
             addToast('info', 'No winnings to redeem (Outcome did not match position)');
          } else if (payout > 0) {
             addToast('success', `Redeemed $${payout.toFixed(2)} winning shares!`);
          }

          return {
              ...prev,
              balance: prev.balance + payout,
              portfolio: newPortfolio,
              transactions: payout > 0 ? [
                  {
                      id: Date.now().toString(),
                      type: 'REDEEM',
                      amount: payout,
                      timestamp: Date.now(),
                      description: `Redeemed winnings from ${market.title}`
                  },
                  ...prev.transactions
              ] : prev.transactions
          };
      });
  };

  return (
    <StoreContext.Provider value={{ 
        user, markets, toasts, addToast, removeToast, 
        connectWallet, disconnectWallet, deposit, withdraw, placeOrder, cancelOrder, 
        updateMarketStatus, redeemWinning 
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};