import type {
  AuthenticationResponseJSON as InternalAuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON as InternalCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON as InternalRequestOptionsJSON,
  RegistrationResponseJSON as InternalRegistrationResponseJSON,
} from '../../node_modules/@simplewebauthn/browser/esm/types/index';

declare module '@simplewebauthn/browser' {
  /** Type exports exist in the package bundle but are omitted from its export map. */
  export type AuthenticationResponseJSON = InternalAuthenticationResponseJSON;
  export type PublicKeyCredentialCreationOptionsJSON = InternalCreationOptionsJSON;
  export type PublicKeyCredentialRequestOptionsJSON = InternalRequestOptionsJSON;
  export type RegistrationResponseJSON = InternalRegistrationResponseJSON;

  export function startAuthentication(input: {
    optionsJSON: InternalRequestOptionsJSON;
    useBrowserAutofill?: boolean;
    verifyBrowserAutofillInput?: boolean;
  }): Promise<InternalAuthenticationResponseJSON>;

  export function startRegistration(input: {
    optionsJSON: InternalCreationOptionsJSON;
    useAutoRegister?: boolean;
  }): Promise<InternalRegistrationResponseJSON>;
}
