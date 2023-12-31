import '../styles/main.scss';
import { RPC } from '@compound-finance/comet-extension';
import { Fragment, useEffect, useMemo, useState } from 'react';
import ERC20 from '../abis/ERC20';
import Comet from '../abis/Comet';
import { 
  CTokenSym, 
  Network, 
  NetworkConfig, 
  getNetwork, 
  getNetworkById, 
  getNetworkConfig, 
  isNetwork, 
  showNetwork 
} from './Network';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract, ContractInterface } from '@ethersproject/contracts';
import { Close } from './Icons/Close';
import { CircleCheckmark } from './Icons/CircleCheckmark';
import { Button, Container, Grid } from '@mui/material';
import MigratePosition from "./components/Migrator/MigratePosition";
import MigrateFrom from "./components/Migrator/MigrateFrom";
import MigrateTo from "./components/Migrator/MigrateTo";
import { getRows, PositionRow } from "./helpers/positions";
import { Position } from "./models/Position";
import Header from "./components/Header/Header";

interface AppProps {
  rpc?: RPC,
  web3: JsonRpcProvider
}

type AppPropsExt<N extends Network> = AppProps & {
  account: string,
  networkConfig: NetworkConfig<N>
}

interface AccountState<Network> {
  extEnabled: boolean;
}

function usePoll(timeout: number) {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let t: NodeJS.Timer;
    function loop(x: number, delay: number) {
      t = setTimeout(() => {
        requestAnimationFrame(() => {
          setTimer(x);
          loop(x + 1, delay);
        });
      }, delay);
    }
    loop(1, timeout);
    return () => clearTimeout(t)
  }, []);

  return timer;
}

function useAsyncEffect(fn: () => Promise<void>, deps: any[] = []) {
  useEffect(() => {
    (async () => {
      await fn();
    })();
  }, deps);
}


export function App<N extends Network>({rpc, web3, account, networkConfig}: AppPropsExt<N>) {
  let { cTokenNames } = networkConfig;
  const [rows, setRows] = useState<PositionRow[]>([]);
  const [selected, setSelected] = useState<PositionRow | null>(null);
  const [provider, setProvider] = useState<string>('compound');
  const [isPositionSelected, setIsPositionSelected] = useState<boolean>(false);
  const [isFormFormFilled, setIsFormFormFilled] = useState<boolean>(false);
  const loading = false;
  const positions: Position[] = [];

  const onNext = () => setIsPositionSelected(true);

  const onFromFormFilled = () => {
    setIsFormFormFilled(true);
  };

  const onBack = () => {
    setSelected(null);
    setIsPositionSelected(false);
  };

  useEffect(() => {
    (() => {
      if (loading) return;
      setRows(getRows(positions));
    })();
  // }, [loading, account, positions]);
  }, []);

  const signer = useMemo(() => {
    return web3.getSigner().connectUnchecked();
  }, [web3, account]);

  const initialAccountState = () => ({
    extEnabled: false,
  });
  const [accountState, setAccountState] = useState<AccountState<Network>>(initialAccountState);

  const ext = useMemo(() => new Contract(networkConfig.extAddress, networkConfig.extAbi, signer), [signer]);
  const comet = useMemo(() => new Contract(networkConfig.rootsV3.comet, Comet, signer), [signer]);

  async function enableExt() {
    await comet.allow(ext.address, true);
  }

  async function disableExt() {
    await comet.allow(ext.address, false);
  }

  return (
    <>
      <Header address={account} enableExt={enableExt} disableExt={disableExt}/>
      <Container
        sx={{
          mt: { xs: '0', sm: '4rem' },
          mb: { xs: '7rem', sm: '0' },
          pl: { xs: '0.25rem' },
          pr: { xs: '0.25rem' },
          minHeight: '75vh',
        }}
      >
        <Grid
          container
          wrap="wrap"
          alignItems="flex-start"
          justifyContent="center"
        >
          {!isPositionSelected ? (
            <Grid item xs={6}>
              <MigratePosition
                provider={provider}
                loading={loading}
                rows={rows}
                selected={selected}
                setSelected={setSelected}
                onNext={onNext}
                account={account}
              />
            </Grid>
          ) : (
            <>
              <Grid item xs={4}>
               <MigrateFrom
               onBack={onBack}
               position={selected!}
               onNext={onFromFormFilled}
               isFormFormFilled={isFormFormFilled}
               />
              </Grid>
              {isFormFormFilled && (
                <Grid item xs={4} ml={{ xs: 0, md: 3 }} mt={{ xs: 3, md: 0 }}>
                  <MigrateTo
                    onNext={() => console.log('implement me')}
                    onBack={() => setIsFormFormFilled(false)}
                  />
                </Grid>
              )}
            </>
          )}
        </Grid>
      </Container>
    </>
  );
};

export default ({rpc, web3}: AppProps) => {
  // let timer = usePoll(10000);
  const [account, setAccount] = useState<string | null>(null);
  const [networkConfig, setNetworkConfig] = useState<NetworkConfig<Network> | 'unsupported' | null>(null);

  useAsyncEffect(async () => {
    let accounts = await web3.listAccounts();
    if (accounts.length > 0) {
      let [account] = accounts;
      setAccount(account);
    }
  // }, [web3, timer]);
  }, []);

  useAsyncEffect(async () => {
    let networkWeb3 = await web3.getNetwork();
    let network = getNetworkById(networkWeb3.chainId);
    if (network) {
      setNetworkConfig(getNetworkConfig(network));
    } else {
      setNetworkConfig('unsupported');
    }
  // }, [web3, timer]);
  }, []);

  if (networkConfig && account) {
    if (networkConfig === 'unsupported') {
      return <div>Unsupported network...</div>;
    } else {
      return <App rpc={rpc} web3={web3} account={account} networkConfig={networkConfig} />;
    }
  } else {
    return <div>Loading...</div>;
  }
};
