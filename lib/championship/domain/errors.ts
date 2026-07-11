export type DomainErrorCode =
  | "INVALID_CARDINALITY"
  | "DUPLICATE_ID"
  | "MATCH_NOT_FOUND"
  | "INVALID_MATCH_STATE"
  | "NO_DECISIVE_WINNER"
  | "NO_TIEBREAK_NEEDED"
  | "INVALID_TIEBREAK_PARTICIPANTS"

export class DomainInvariantError extends Error {
  readonly code: DomainErrorCode

  constructor(code: DomainErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = "DomainInvariantError"
  }
}
