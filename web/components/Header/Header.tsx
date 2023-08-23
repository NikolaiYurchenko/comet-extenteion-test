import {AppBar, Box, Grid, Toolbar, useMediaQuery} from "@mui/material";
import {useTheme} from "@mui/material/styles";
import WalletAddress from "./WalletAddress";
import {LogoTitle} from "../Shared/Icons/LogoTitle";

type HeaderProps = {
  enableExt: () => void;
  disableExt: () => void;
  address?: string;
}

function Header({ enableExt, disableExt, address = '' }: HeaderProps) {
  const { palette, breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  return(
    <AppBar position="static">
      <Box
        p="0 1.25rem"
        sx={{
          width: '100%',
          background: palette.background.paper,
          ['@media screen and (max-width: 346px)']: {
            p: '0 0.5rem',
          },
        }}
      >
        <Toolbar
          disableGutters
          sx={{ '@media (min-width: 600px)': { minHeight: '4.75rem' } }}
        >
          <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            sx={{ width: '100%' }}
          >
            <Grid item>
              <a href="/">
                <Box
                  maxWidth={isMobile ? 120 : 180}
                  maxHeight={50}
                  sx={{
                    width: '12rem',
                  }}
                >
                  <LogoTitle style={
                    isMobile
                      ? { width: '100%', height: 'auto' }
                      : { marginLeft: '10px', height: '30px' }
                  } />
                </Box>
              </a>
            </Grid>
            <Grid item>
              <WalletAddress address={address} enableExt={enableExt} disableExt={disableExt} />
            </Grid>
          </Grid>
        </Toolbar>
      </Box>
    </AppBar>
  )
}

export default Header;
