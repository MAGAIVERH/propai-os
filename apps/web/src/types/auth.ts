export type AuthUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
};

export type AuthSession = {
  id: string;
  userId: string;
  activeOrganizationId: string | null;
  expiresAt: string;
};

export type AuthSessionData = {
  session: AuthSession;
  user: AuthUser;
};

export type AuthOrganization = {
  id: string;
  name: string;
  slug: string;
};

export type BrokerageSignUpResult = {
  user: AuthUser;
  organization: AuthOrganization;
  session: {
    activeOrganizationId: string;
  };
};

export type SignInWithEmailInput = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type SignUpBrokerageInput = {
  email: string;
  password: string;
  name: string;
  organizationName: string;
};
