import {
  CHAIN,
  Chain,
  CHAIN_BLOCK_EXPLORER_URL,
  CHAIN_NAME,
  ChainId,
  ChainType,
} from '@x-fuji/sdk';

const chainsWithType = (type: ChainType) =>
  Object.values(CHAIN).filter((c) => c.isDeployed && c.chainType === type);

export const chains: Chain[] = chainsWithType(ChainType.MAINNET);
export const testChains: Chain[] = chainsWithType(ChainType.TESTNET);


const rpcs = {
  [ChainId.ETHEREUM]: `https://mainnet.infura.io/v3/${import.meta.env.NEXT_PUBLIC_INFURA_KEY}`,
  [ChainId.MATIC]: 'https://matic-mainnet.chainstacklabs.com',
  [ChainId.FANTOM]: 'https://rpcapi.fantom.network',
  [ChainId.ARBITRUM]: 'https://arb1.arbitrum.io/rpc',
  [ChainId.OPTIMISM]: 'https://optimism-mainnet.public.blastapi.io/',
  [ChainId.GNOSIS]: 'https://rpc.gnosischain.com/',
  [ChainId.GOERLI]: `https://goerli.infura.io/v3/${import.meta.env.NEXT_PUBLIC_INFURA_KEY}`,
  [ChainId.MATIC_MUMBAI]: 'https://matic-mainnet.chainstacklabs.com',
  [ChainId.OPTIMISM_GOERLI]: 'https://goerli.optimism.io/',
};

export function chainName(id?: ChainId): string {
  if (!id) return '';
  return CHAIN_NAME[id];
}

export function isChain(id: number): boolean {
  return ChainId[Number(id)] !== undefined;
}

export function isSupported(id?: ChainId): boolean {
  return chains.some((chain) => chain.chainId === id && chain.isDeployed);
}

export function chainIdToHex(id: ChainId): string {
  return `0x${id.toString(16)}`;
}

export function hexToChainId(hex?: string): ChainId | undefined {
  if (!hex) return undefined;
  return parseInt(hex, 16);
}

export function transactionUrl(id: ChainId, hash: string) {
  return explorerUrl(hash, 'tx', id);
}

export function addressUrl(address: string, id?: ChainId) {
  return explorerUrl(address, 'address', id);
}

function explorerUrl(value: string, type: 'tx' | 'address', id?: ChainId) {
  if (id === undefined) return;
  return CHAIN_BLOCK_EXPLORER_URL[id] + type + '/' + value;
}
