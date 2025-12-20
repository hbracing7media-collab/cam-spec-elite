import { useShortBlocks } from "@/lib/context/ShortBlocksContext";

/**
 * Hook to get a short block by ID from the global context
 */
export const useShortBlockById = (id: string | undefined) => {
  const { getBlockById } = useShortBlocks();
  return id ? getBlockById(id) : undefined;
};

/**
 * Hook to get all short blocks matching an engine make
 */
export const useShortBlocksByMake = (make: string | undefined) => {
  const { getBlocksByMake } = useShortBlocks();
  return make ? getBlocksByMake(make) : [];
};

/**
 * Hook to get all short blocks matching an engine family
 */
export const useShortBlocksByFamily = (family: string | undefined) => {
  const { getBlocksByFamily } = useShortBlocks();
  return family ? getBlocksByFamily(family) : [];
};

/**
 * Hook to get all short blocks matching a make AND family
 */
export const useShortBlocksByMakeAndFamily = (make: string | undefined, family: string | undefined) => {
  const { getBlocksByMakeAndFamily } = useShortBlocks();
  return make && family ? getBlocksByMakeAndFamily(make, family) : [];
};

/**
 * Hook to get all short blocks matching a displacement
 */
export const useShortBlocksByDisplacement = (displacement: string | undefined) => {
  const { getBlocksByDisplacement } = useShortBlocks();
  return displacement ? getBlocksByDisplacement(displacement) : [];
};

/**
 * Hook to get all user's short blocks
 */
export const useAllShortBlocks = () => {
  const { blocks } = useShortBlocks();
  return blocks;
};

/**
 * Hook to check if short blocks are loaded
 */
export const useShortBlocksLoaded = () => {
  const { isInitialized, loading } = useShortBlocks();
  return isInitialized && !loading;
};
