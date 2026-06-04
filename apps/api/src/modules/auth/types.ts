/** Session shape aligned with Better Auth + organization plugin. */
export type PropAiSession = {
  user: {
    id: string;
  };
  session: {
    activeOrganizationId: string | null;
  };
};
