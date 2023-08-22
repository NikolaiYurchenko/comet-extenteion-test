import { Chain as OnboardChain } from '@web3-onboard/common';
import {
  CHAIN,
  Chain,
  CHAIN_BLOCK_EXPLORER_URL,
  CHAIN_NAME,
  ChainId,
  ChainType,
  NATIVE,
} from '@x-fuji/sdk';

const chainsWithType = (type: ChainType) =>
  Object.values(CHAIN).filter((c) => c.isDeployed && c.chainType === type);

export const chains: Chain[] = chainsWithType(ChainType.MAINNET);
export const testChains: Chain[] = chainsWithType(ChainType.TESTNET);

// if (process.env.NEXT_PUBLIC_APP_ENV === "development") {
//   chains.push(...testChains)
// }

const rpcs = {
  [ChainId.ETHEREUM]: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`,
  [ChainId.MATIC]: 'https://matic-mainnet.chainstacklabs.com',
  [ChainId.FANTOM]: 'https://rpcapi.fantom.network',
  [ChainId.ARBITRUM]: 'https://arb1.arbitrum.io/rpc',
  [ChainId.OPTIMISM]: 'https://optimism-mainnet.public.blastapi.io/',
  [ChainId.GNOSIS]: 'https://rpc.gnosischain.com/',
  [ChainId.GOERLI]: `https://goerli.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`,
  [ChainId.MATIC_MUMBAI]: 'https://matic-mainnet.chainstacklabs.com',
  [ChainId.OPTIMISM_GOERLI]: 'https://goerli.optimism.io/',
};

export const onboardChains: OnboardChain[] = chains.map((c) => {
  return {
    id: chainIdToHex(c.chainId),
    label: c.name,
    blockExplorerUrl: c.blockExplorerUrl,
    token: NATIVE[c.chainId].symbol ?? 'ETH',
    rpcUrl: c.connection?.rpcProvider.connection.url ?? rpcs[c.chainId],
  };
});

export function chainName(id?: ChainId): string {
  if (!id) return '';
  return CHAIN_NAME[id];
}
