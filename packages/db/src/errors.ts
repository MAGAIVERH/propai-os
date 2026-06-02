/** Thrown when a handler requires tenant scope but none is available. */
export class TenantContextRequiredError extends Error {
  constructor(message = "Tenant context is required for this operation.") {
    super(message);
    this.name = "TenantContextRequiredError";
  }
}
