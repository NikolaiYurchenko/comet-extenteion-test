import { Palette } from '@mui/material';
import {
  Address,
  BorrowingVault,
  ChainId,
  FujiError,
  FujiResultError,
  FujiResultPromise,
  FujiResultSuccess,
  VaultType,
} from '@x-fuji/sdk';

import { DUST_AMOUNT, Ltv } from '../constants/asset';
import {
  AssetMeta,
  BorrowingPosition,
  LendingPosition,
  newPosition,
  Position,
} from '../models/Position';
import { AssetChange, AssetType, Mode } from './assets';
import { bigToFloat, formatNumber } from './values';

export type PositionData = {
  position: Position;
  editedPosition?: Position;
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

export const getTotalSum = (
  positions: Position[],
  assetType: AssetType
): number => {
  return positions.reduce(
    (s, p) =>
      (p.type === VaultType.BORROW
        ? p[assetType].amount * p[assetType].usdPrice
        : assetType === AssetType.Collateral
          ? p[assetType].amount * p[assetType].usdPrice
          : 0) + s,
    0
  );
};

export const getAccrual = (
  usdBalance: number,
  type: AssetType,
  baseAPR?: number
): number => {
  const factor = type === AssetType.Debt ? -1 : 1;
  // `baseAPR` returned bu SDK is formatted in %, therefore to get decimal we divide by 100.
  const aprDecimal = baseAPR ? baseAPR / 100 : 0;
  // Blockchain APR compounds per block, and daily compounding is a close estimation for APY
  const apyDecimal = (1 + aprDecimal / 365) ** 365 - 1;
  return factor * usdBalance * apyDecimal;
};

export const getCurrentAvailableBorrowingPower = (
  positions: BorrowingPosition[]
): number => {
  return positions.reduce((b, pos) => {
    const collateralUsdValue = pos.collateral.amount * pos.collateral.usdPrice;
    const debtUsdValue = pos.debt.amount * pos.debt.usdPrice;
    return collateralUsdValue * pos.ltvMax - debtUsdValue + b;
  }, 0);
};

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

export const viewEditedLendingPosition = (
  collateral: AssetChange,
  current: LendingPosition,
  mode: Mode
): LendingPosition => {
  const future = JSON.parse(JSON.stringify(current));
  const collateralInput = parseFloat(
    collateral.input === '' ? '0' : collateral.input
  );
  if (mode === Mode.DEPOSIT) {
    future.collateral.amount = current.collateral.amount + collateralInput;
  } else if (mode === Mode.WITHDRAW) {
    future.collateral.amount = current.collateral.amount - collateralInput;
  }
  return future;
};

export const viewEditedBorrowingPosition = (
  collateral: AssetChange,
  debt: AssetChange,
  current: BorrowingPosition,
  mode: Mode
): BorrowingPosition => {
  const future = JSON.parse(JSON.stringify(current));
  const collateralInput = parseFloat(
    collateral.input === '' ? '0' : collateral.input
  );
  const debtInput = parseFloat(debt.input === '' ? '0' : debt.input);
  if (mode === Mode.DEPOSIT) {
    future.collateral.amount = current.collateral.amount + collateralInput;
  } else if (mode === Mode.WITHDRAW) {
    future.collateral.amount = current.collateral.amount - collateralInput;
  } else if (mode === Mode.DEPOSIT_AND_BORROW) {
    future.collateral.amount = current.collateral.amount + collateralInput;
    future.debt.amount = current.debt.amount + debtInput;
  } else if (mode === Mode.PAYBACK_AND_WITHDRAW) {
    future.collateral.amount = current.collateral.amount - collateralInput;
    future.debt.amount = current.debt.amount - debtInput;
  } else if (mode === Mode.PAYBACK) {
    future.debt.amount = current.debt.amount - debtInput;
  } else if (mode === Mode.BORROW) {
    future.debt.amount = current.debt.amount + debtInput;
  }
  const collatUsdValue = future.collateral.amount * future.collateral.usdPrice;
  const debtUsdValue = future.debt.amount * future.debt.usdPrice;
  future.ltv = (debtUsdValue / collatUsdValue) * 100;
  future.liquidationPrice =
    debtUsdValue / (future.ltvThreshold * future.collateral.amount);
  future.liquidationDiff = future.collateral.usdPrice - future.liquidationPrice;
  future.ltvThreshold = future.ltvThreshold * 100;
  return future;
};

export const getEstimatedEarnings = ({
                                       days,
                                       collateralInUsd,
                                       debtInUsd,
                                       collateralAPR = 1,
                                       debtAPR = 1,
                                     }: {
  days: number;
  collateralInUsd: number;
  debtInUsd: number;
  collateralAPR?: number;
  debtAPR?: number;
}) => {
  return (
    ((collateralInUsd * collateralAPR - debtInUsd * debtAPR) / 100 / 365) * days
  );
};

export const borrowingPositionsAtRisk = (
  positions: BorrowingPosition[]
): BorrowingPosition[] => {
  return positions.filter((pos) => {
    return (pos.ltvMax - pos.ltv) * 100 < Ltv.RISK;
  });
};

export const liquidationColor = (
  percentage: number | string,
  palette: Palette,
  recommended?: number
) => {
  if (typeof percentage === 'string' || !recommended) return palette.info.main;
  return percentage <= recommended
    ? palette.success.main
    : palette.warning.main;
};

export const belowPriceColor = (
  percentage: number | string,
  palette: Palette,
  min?: number
) => {
  if (typeof percentage === 'string' || !min) return palette.info.main;
  if (percentage <= 5) return palette.error.main;
  return percentage <= min ? palette.warning.main : palette.success.main;
};

const handleDisplayLiquidationPrice = (liqPrice?: number) => {
  if (liqPrice === undefined || liqPrice === 0) {
    return '-';
  } else {
    return formatNumber(liqPrice, liqPrice < 10 ? 2 : 0);
  }
};

const dynamicPositionMeta = (
  dynamic: boolean, // If tue, it means we need to show data the user is inputting
  source: AssetChange,
  positionMeta?: AssetMeta
): AssetMeta => {
  if (positionMeta) return positionMeta;
  return {
    amount: dynamic ? Number(source.input) : source.amount,
    usdPrice: source.usdPrice,
    currency: source.currency,
  };
};
