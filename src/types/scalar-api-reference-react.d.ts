declare module '@scalar/api-reference-react' {
  import type { ComponentType } from 'react';
  import type { ReferenceProps } from '@scalar/api-reference';

  /** Runtime export present in 0.5.2 but omitted by its published declaration entrypoint. */
  export const ApiReferenceReact: ComponentType<ReferenceProps>;
  export type { ReferenceProps };
}
