import {
  ChainId,
  Currency,
  RoutingStep,
  RoutingStepDetails,
  VaultType,
} from '@x-fuji/sdk';

import {
  DEFAULT_CHAIN_ID,
  Ltv,
  ETHEREUM_BRIDGING_AMOUNT_USD_THRESHOLD,
} from '../constants';
import { AssetMeta } from '../models/Position';
import { PositionData } from './positions';
import { safeBnToNumber } from './values';

export enum AprType {
  BORROW,
  SUPPLY,
}

export enum Mode {
  DEPOSIT_AND_BORROW, // addPosition: both collateral and debt
  PAYBACK_AND_WITHDRAW, // removePosition: both collateral and debt
  DEPOSIT, // addPosition: collateral
  BORROW, //addPosition: debt
  WITHDRAW, // removePosition: collateral
  PAYBACK, // removePosition: debt
}

export enum AssetType {
  Debt = 'debt',
  Collateral = 'collateral',
}

export enum FetchStatus {
  Initial,
  Loading,
  Ready,
  Error,
}

export enum AllowanceStatus {
  Initial,
  Loading,
  Ready,
  Error,
  Approving,
  Unneeded,
}

export type AssetChange = {
  selectableCurrencies: Currency[];
  balances: Record<string, number>;
  allowance: Allowance;
  input: string;
  chainId: ChainId;
  currency: Currency;
  amount: number;
  usdPrice: number;
};

export type LtvMeta = {
  ltv: number;
  ltvMax: number;
  ltvThreshold: number;
};

export type LiquidationMeta = {
  liquidationPrice: number;
  liquidationDiff: number;
};

export enum ActionType {
  ADD = 0,
  REMOVE = 1,
}

type Allowance = {
  status: AllowanceStatus;
  value?: number;
};

export const foundCurrency = (
  selectable: Currency[],
  updated?: Currency
): Currency | undefined => {
  return updated && selectable.find((c) => c.symbol === updated.symbol);
};

export const defaultCurrency = (
  selectable: Currency[],
  updated?: Currency
): Currency => {
  return foundCurrency(selectable, updated) || selectable[0];
};

export const defaultAssetForType = (
  type: AssetType,
  vaultType: VaultType
): AssetChange => {
  const defaultCurrencies =
    type === AssetType.Debt
      ? defaultDebtCurrencies
      : vaultType === VaultType.BORROW
      ? defaultCollateralCurrencies
      : defaultSupplyCurrencies;
  return assetForData(
    DEFAULT_CHAIN_ID,
    defaultCurrencies,
    defaultCurrency(defaultCurrencies)
  );
};

export const assetForData = (
  chainId: ChainId,
  selectableCurrencies: Currency[],
  currency: Currency
): AssetChange => {
  return {
    selectableCurrencies,
    balances: {},
    input: '',
    chainId,
    allowance: {
      status: AllowanceStatus.Initial,
      value: undefined,
    },
    currency,
    amount: 0,
    usdPrice: 0,
  };
};

export const recommendedLTV = (ltvMax: number): number => {
  return ltvMax > Ltv.DECREASE ? ltvMax - Ltv.DECREASE : 0;
};

export const needsAllowance = (
  mode: Mode,
  type: AssetType,
  asset: AssetChange,
  amount: number
): boolean => {
  if (asset.allowance.status === AllowanceStatus.Unneeded) {
    return false;
  }
  return (
    (type === AssetType.Debt
      ? mode === Mode.PAYBACK || mode === Mode.PAYBACK_AND_WITHDRAW
      : mode === Mode.DEPOSIT || mode === Mode.DEPOSIT_AND_BORROW) &&
    asset.allowance.value !== undefined &&
    asset.allowance.value < amount
  );
};

export const maxBorrowLimit = (
  collateral: number,
  price: number,
  maxLtv: number
): number => {
  const value = (collateral * price * maxLtv) / 100;
  return value > 0 ? value : 0;
};

export const remainingBorrowLimit = (
  collateral: AssetMeta,
  debt: AssetMeta,
  maxLtv: number
): number => {
  const max = maxBorrowLimit(collateral.amount, collateral.usdPrice, maxLtv);
  return max - debt?.amount * debt?.usdPrice;
};

export const ltvMeta = (positionData?: PositionData): LtvMeta | undefined => {
  if (!positionData?.position || positionData.position.type === VaultType.LEND)
    return undefined;
  const { position, editedPosition } = positionData;
  return {
    ltv:
      editedPosition && 'ltv' in editedPosition
        ? editedPosition.ltv
        : position.ltv,
    ltvMax: position.ltvMax,
    ltvThreshold:
      editedPosition && 'ltvThreshold' in editedPosition
        ? editedPosition.ltvThreshold
        : position.ltvThreshold,
  };
};



export const invalidBridgingAmount = (
  steps: RoutingStepDetails[],
  collateral: AssetChange,
  debt?: AssetChange
) => {
  for (const step of steps) {
    if (step.step === RoutingStep.X_TRANSFER && step.token) {
      const asset = [collateral, debt]
        .filter((asset) => asset)
        .find(
          (asset) =>
            asset && asset.currency.wrapped.symbol === step.token?.symbol
        );
      if (step.token && step.amount && asset) {
        const amount = safeBnToNumber(step.amount, step.token.decimals);
        const amountUsd = amount * asset.usdPrice;
        if (
          asset &&
          step.token.chainId === ChainId.ETHEREUM &&
          amountUsd > 0 &&
          amountUsd < ETHEREUM_BRIDGING_AMOUNT_USD_THRESHOLD
        ) {
          return true;
        }
      }
    }
  }
  return false;
};
