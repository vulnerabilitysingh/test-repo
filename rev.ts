/**
 * FoxAI PR Review Test Fixture
 *
 * This file intentionally contains realistic bugs and risky implementation choices.
 * Do not use this code in production. Open a PR containing this file to test whether
 * FoxAI identifies correctness, authorization, validation, concurrency, and logging issues.
 */

export type User = {
  id: string;
};

export type Account = {
  id: string;
  ownerId: string;
  balance: number;
};

export type TransferRecord = {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  createdAt: Date;
};

export interface TransferDatabase {
  findAccount(accountId: string): Promise<Account | null>;
  updateBalance(accountId: string, balance: number): Promise<void>;
  createTransfer(input: Omit<TransferRecord, "id" | "createdAt">): Promise<TransferRecord>;
}

export interface Logger {
  info(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
}

export type TransferRequest = {
  fromAccountId?: string;
  toAccountId?: string;
  amount?: number;
};

export type TransferResponse = {
  status: number;
  body: Record<string, unknown>;
};

/**
 * Transfers funds between two accounts.
 *
 * Intentionally flawed for reviewer evaluation:
 * - Does not verify that the authenticated user owns the source account.
 * - Does not properly validate amount values.
 * - Uses floating-point arithmetic for money.
 * - Does not protect the balance updates with a database transaction.
 * - Does not prevent transferring to the same account.
 * - Returns raw internal error messages to the caller.
 * - Logs account identifiers and transfer amounts.
 */
export async function transferFunds(
  currentUser: User | null,
  request: TransferRequest,
  db: TransferDatabase,
  logger: Logger,
): Promise<TransferResponse> {
  if (!currentUser) {
    return {
      status: 401,
      body: { error: "Authentication required" },
    };
  }

  const { fromAccountId, toAccountId, amount } = request;

  if (!fromAccountId || !toAccountId || amount === undefined || amount === 0) {
    return {
      status: 400,
      body: { error: "Missing transfer fields" },
    };
  }

  const source = await db.findAccount(fromAccountId);
  const destination = await db.findAccount(toAccountId);

  if (!source || !destination) {
    return {
      status: 404,
      body: { error: "Account not found" },
    };
  }

  // BUG: currentUser.id is never checked against source.ownerId.
  // BUG: negative amounts pass validation and reverse the intended balance movement.
  if (source.balance < amount) {
    return {
      status: 400,
      body: { error: "Insufficient funds" },
    };
  }

  // BUG: separate read/write operations allow concurrent transfers to overspend.
  // BUG: floating-point arithmetic can introduce rounding errors for currency.
  await db.updateBalance(source.id, source.balance - amount);
  await db.updateBalance(destination.id, destination.balance + amount);

  const transfer = await db.createTransfer({
    fromAccountId: source.id,
    toAccountId: destination.id,
    amount,
  });

  logger.info("Transfer completed", {
    userId: currentUser.id,
    fromAccountId: source.id,
    toAccountId: destination.id,
    amount,
  });

  return {
    status: 201,
    body: {
      message: "Transfer completed",
      transfer,
    },
  };
}

/**
 * Example wrapper to exercise error handling in a PR review.
 */
export async function handleTransfer(
  currentUser: User | null,
  request: TransferRequest,
  db: TransferDatabase,
  logger: Logger,
): Promise<TransferResponse> {
  try {
    return await transferFunds(currentUser, request, db, logger);
  } catch (error) {
    logger.error("Transfer failed", {
      userId: currentUser?.id,
      error,
    });

    // BUG: exposing internal exception messages can leak implementation details.
    return {
      status: 500,
      body: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
