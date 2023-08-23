import {Button, Chip} from "@mui/material";

type WalletAddressProps = {
  enableExt: () => void;
  disableExt: () => void;
  address: string
}

function WalletAddress({enableExt, disableExt, address}: WalletAddressProps) {

  const hiddenAddress = (address: string | undefined) =>
    address?.substring(0, 5) + '...' + address?.substring(address?.length - 4);

  const formattedAddress = hiddenAddress(address);

  return(
    address ? <Chip
      onClick={disableExt}
      label={formattedAddress}
      sx={{
        borderRadius: '4rem',
        height: '2.25rem',
        padding: '0.438rem 0.75rem',
        cursor: 'pointer',
        fontSize: '0.875rem',
        position: 'relative',
        left: '-2rem',
      }}
    /> : <Button
      variant="secondary"
      sx={{
        fontSize: '1rem',
        ['@media screen and (max-width: 346px)']: {
          fontSize: '0.6rem',
        },
      }}
      onClick={enableExt}
    >
      Connect wallet
    </Button>
  )
}

export default WalletAddress;
