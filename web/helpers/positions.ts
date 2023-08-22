export const getRows = (positions: Position[]): PositionRow[] => {
  if (positions.length === 0) {
    return [];
  } else {
    return positions.map((pos: Position) => {
      const isBorrowing = pos.type === VaultType.BORROW;
      const debt =
        isBorrowing && pos.vault instanceof BorrowingVault
          ? {
            symbol: pos.vault?.debt.symbol || '',
            amount: pos.debt.amount,
            usdValue: pos.debt.amount * pos.debt.usdPrice,
            baseAPR: pos.debt.baseAPR,
          }
          : undefined;

      return {
        safetyRating: Number(pos.vault?.safetyRating?.toString()) ?? 0,
        address: pos.vault?.address.value,
        chainId: pos.vault?.chainId,
        debt,
        collateral: {
          symbol: pos.vault?.collateral.symbol || '',
          amount: pos.collateral.amount,
          usdValue: pos.collateral.amount * pos.collateral.usdPrice,
          baseAPR: pos.collateral.baseAPR,
        },
        apr: isBorrowing ? formatNumber(pos.debt.baseAPR, 2) : '-',
        liquidationPrice: isBorrowing
          ? handleDisplayLiquidationPrice(pos.liquidationPrice)
          : '-',
        oraclePrice: pos.collateral.usdPrice,
        percentPriceDiff: isBorrowing ? pos.liquidationDiff : '-',
        ltv: isBorrowing ? pos.ltv * 100 : 0,
        ltvMax: isBorrowing ? pos.ltvMax * 100 : 0,
        activeProvidersNames: pos.activeProvidersNames,
      };
    });
  }
};

export type PositionRow = {
  debt?: {
    symbol: string | '-';
    amount: number | '-';
    usdValue: number | 1;
    baseAPR?: number | 0;
  };
  collateral: {
    symbol: string | '-';
    amount: number | '-';
    usdValue: number | 1;
    baseAPR?: number | 0;
  };
  apr: number | '-';
  liquidationPrice: number | '-';
  oraclePrice: number | '-';
  percentPriceDiff: number | '-';
  ltv: number | 0;
  ltvMax: number | 0;
  safetyRating: number | 0;
  activeProvidersNames: string[];
  chainId?: number;
  address?: string;
};

export enum VaultType {
  BORROW = 0,
  LEND = 1
}
