import React, { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

type WarningInfoProps = {
  text: string | ReactNode;
  withoutIcon?: boolean;
};

function WarningInfo({ text, withoutIcon = false }: WarningInfoProps) {
  const { palette } = useTheme();

  return (
    <Box
      sx={{
        flex: 1,
        p: '0.5rem 1rem',
        backgroundColor: alpha(palette.warning.main, 0.1),
        borderRadius: 2,
      }}
    >
      <Stack flexDirection="row" alignItems="center" gap={1.5}>
        {!withoutIcon && (
          <img
            src="/assets/images/shared/warning.svg"
            width={15}
            height={15}
            alt="Warning Icon"
          />
        )}
        <Typography
          variant="xsmall"
          color={palette.warning.main}
          lineHeight="160%"
          textAlign="left"
        >
          {text}
        </Typography>
      </Stack>
    </Box>
  );
}

export default WarningInfo;
