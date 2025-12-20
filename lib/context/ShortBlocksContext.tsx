'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ShortBlock {
  id: string;
  user_id: string;
  block_name: string;
  engine_make?: string;
  engine_family?: string;
  displacement?: string;
  bore?: string;
  stroke?: string;
  deck_height?: string;
  piston_dome_dish?: string;
  head_gasket_bore?: string;
  head_gasket_compressed_thickness?: string;
  rod_length?: string;
  created_at?: string;
  updated_at?: string;
}

interface ShortBlocksContextType {
  blocks: ShortBlock[];
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Refresh/Load methods
  loadBlocks: () => Promise<void>;
  
  // Query methods
  getBlockById: (id: string) => ShortBlock | undefined;
  getBlocksByMake: (make: string) => ShortBlock[];
  getBlocksByFamily: (family: string) => ShortBlock[];
  getBlocksByMakeAndFamily: (make: string, family: string) => ShortBlock[];
  getBlocksByDisplacement: (displacement: string) => ShortBlock[];
  
  // Add/update/delete (for optimistic updates)
  addBlock: (block: ShortBlock) => void;
  updateBlock: (id: string, updates: Partial<ShortBlock>) => void;
  removeBlock: (id: string) => void;
}

const ShortBlocksContext = createContext<ShortBlocksContextType | undefined>(undefined);

export const ShortBlocksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [blocks, setBlocks] = useState<ShortBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load blocks on mount
  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/profile/short-blocks');
      if (!res.ok) {
        throw new Error('Failed to load short blocks');
      }
      
      const data = await res.json();
      if (data.ok && Array.isArray(data.blocks)) {
        setBlocks(data.blocks);
      }
      
      setIsInitialized(true);
    } catch (err: any) {
      console.error('Error loading short blocks:', err);
      setError(err.message);
      setIsInitialized(true);
    } finally {
      setLoading(false);
    }
  };

  const getBlockById = (id: string): ShortBlock | undefined => {
    return blocks.find(b => b.id === id);
  };

  const getBlocksByMake = (make: string): ShortBlock[] => {
    return blocks.filter(b => b.engine_make?.toLowerCase() === make.toLowerCase());
  };

  const getBlocksByFamily = (family: string): ShortBlock[] => {
    return blocks.filter(b => b.engine_family?.toLowerCase() === family.toLowerCase());
  };

  const getBlocksByMakeAndFamily = (make: string, family: string): ShortBlock[] => {
    return blocks.filter(
      b => 
        b.engine_make?.toLowerCase() === make.toLowerCase() &&
        b.engine_family?.toLowerCase() === family.toLowerCase()
    );
  };

  const getBlocksByDisplacement = (displacement: string): ShortBlock[] => {
    return blocks.filter(b => b.displacement?.toLowerCase() === displacement.toLowerCase());
  };

  const addBlock = (block: ShortBlock) => {
    setBlocks(prev => [...prev, block]);
  };

  const updateBlock = (id: string, updates: Partial<ShortBlock>) => {
    setBlocks(prev =>
      prev.map(b => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const value: ShortBlocksContextType = {
    blocks,
    loading,
    error,
    isInitialized,
    loadBlocks,
    getBlockById,
    getBlocksByMake,
    getBlocksByFamily,
    getBlocksByMakeAndFamily,
    getBlocksByDisplacement,
    addBlock,
    updateBlock,
    removeBlock,
  };

  return (
    <ShortBlocksContext.Provider value={value}>
      {children}
    </ShortBlocksContext.Provider>
  );
};

// Hook to use the context
export const useShortBlocks = (): ShortBlocksContextType => {
  const context = useContext(ShortBlocksContext);
  if (!context) {
    throw new Error('useShortBlocks must be used within ShortBlocksProvider');
  }
  return context;
};
