type StoredInvitation = {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  acceptPath: string;
};

const invitationsByEmail = new Map<string, StoredInvitation>();

/** Records the latest invitation for dev/test flows (no SMTP). */
export function recordDevInvitation(invitation: StoredInvitation): void {
  invitationsByEmail.set(invitation.email.toLowerCase(), invitation);
}

/** Returns the latest invitation captured for an email (tests / manual QA). */
export function getDevInvitationByEmail(email: string): StoredInvitation | null {
  return invitationsByEmail.get(email.toLowerCase()) ?? null;
}

/** Clears stored invitations between tests. */
export function clearDevInvitations(): void {
  invitationsByEmail.clear();
}
