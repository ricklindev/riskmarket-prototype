export enum OrderType {
  LIMIT = 'LIMIT',
  MARKET = 'MARKET'
}

export enum Side {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum Outcome {
  YES = 'YES',
  NO = 'NO'
}

export enum MarketStatus {
  OPEN = 'OPEN',
  PAUSED = 'PAUSED',
  RESOLVED = 'RESOLVED'
}

export type MarketCategory = 'Exchange' | 'DeFi' | 'Stablecoin';

export interface OrderBookItem {
  price: number;
  size: number;
  total: number;
}

export interface Market {
  id: string;
  category: MarketCategory;
  title: string;
  description: string;
  expirationDate: string;
  volume: number;
  currentPrice: number; // Probability of YES (0-1)
  image: string;
  bids: OrderBookItem[]; // Buy YES orders
  asks: OrderBookItem[]; // Sell YES orders
  status: MarketStatus;
  resolutionOutcome?: Outcome;
  resolutionReference?: string;
}

export interface Position {
  marketId: string;
  marketTitle: string;
  outcome: Outcome;
  quantity: number;
  averageEntryPrice: number;
}

export interface OpenOrder {
  id: string;
  marketId: string;
  marketTitle: string;
  side: Side;
  outcome: Outcome;
  price: number;
  quantity: number;
  timestamp: number;
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRADE_BUY' | 'TRADE_SELL' | 'REDEEM' | 'CANCEL_ORDER';
  amount: number;
  timestamp: number;
  description: string;
}

export interface UserState {
  isConnected: boolean;
  balance: number;
  address: string | null;
  portfolio: Position[];
  openOrders: OpenOrder[];
  transactions: Transaction[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}