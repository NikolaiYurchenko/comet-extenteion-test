import { SyntheticEvent } from 'react';

export interface Icon {
  src?: string;
  alt?: string;
  width: string | number;
  height: string | number;
  sx?: object;
}

export function renderIconError(props: Icon) {
  const { ...rest } = props;

  return (
    <img {...rest} src={'/assets/images/shared/noIcon.svg'} alt={`no icon`} />
  );
}

export function renderIcon(
  props: Icon,
  path: string,
  name: string,
  onError: (e: SyntheticEvent<HTMLImageElement, Event>) => void,
  defaultImage?: string
) {
  const { ...rest } = props;
  return (
    <>
      {props.sx ? (
        <div style={props.sx}>
          <img
            {...rest}
            src={defaultImage || path}
            alt={`${name} icon`}
            onError={onError}
          />
        </div>
      ) : (
        <img
          {...rest}
          src={defaultImage || path}
          alt={`${name} icon`}
          onError={onError}
        />
      )}
    </>
  );
}
