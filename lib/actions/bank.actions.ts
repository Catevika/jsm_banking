"use server";

import {
  CountryCode
} from "plaid";

import { plaidClient } from "../plaid";
import { parseStringify } from "../utils";

import { getTransactionsByBankId } from "./transaction.actions";
import { getBank, getBanks } from "./user.actions";

const getPlaidErrorCode = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "response" in error &&
  typeof error.response === "object" &&
  error.response !== null &&
  "data" in error.response &&
  typeof error.response.data === "object" &&
  error.response.data !== null &&
  "error_code" in error.response.data
    ? String(error.response.data.error_code)
    : null;

const isItemLoginRequired = (error: unknown) =>
  getPlaidErrorCode(error) === "ITEM_LOGIN_REQUIRED";

// Get multiple bank accounts
export const getAccounts = async ({ userId }: GetAccountsProps): Promise<{
  data: Account[];
  totalBanks: number;
  totalCurrentBalance: number;
}> => {
  try {
    // get banks from db
    const banks = await getBanks({ userId });

    const linkedAccounts = await Promise.all(
      banks.map(async (bank) => {
        let accountsResponse;
        try {
          // get each account info from plaid
          accountsResponse = await plaidClient.accountsGet({
            access_token: bank.accessToken,
          });
        } catch (error) {
          if (isItemLoginRequired(error)) {
            console.warn(`Skipping stale Plaid bank ${bank.$id}: reconnect required`);
            return null;
          }
          throw error;
        }
        const accountData = accountsResponse.data.accounts.find(
          (account) => account.account_id === bank.accountId
        );
        if (!accountData) {
          throw new Error(
            `Plaid account ${bank.accountId} was not found for bank record ${bank.$id}`
          );
        }

        // get institution info from plaid
        const institution = await getInstitution({
          institutionId: accountsResponse.data.item.institution_id!,
        });
        if (!institution) throw new Error("Institution not found");

        const account = {
          id: accountData.account_id,
          availableBalance: accountData.balances.available!,
          currentBalance: accountData.balances.current!,
          institutionId: institution.institution_id,
          name: accountData.name,
          officialName: accountData.official_name,
          mask: accountData.mask!,
          type: accountData.type as string,
          subtype: accountData.subtype! as string,
          appwriteItemId: bank.$id,
          sharableId: bank.sharableId,
        };

        return account;
      })
    );

    const seenAccounts = new Set<string>();
    const accounts = linkedAccounts.filter((account): account is Account => {
      if (!account) return false;

      const identity = account.mask
        ? JSON.stringify([
            account.institutionId,
            account.name.trim().toLowerCase(),
            account.mask,
            account.type,
            account.subtype,
          ])
        : JSON.stringify([
            account.institutionId,
            account.name.trim().toLowerCase(),
            account.type,
            account.subtype,
          ]);

      if (seenAccounts.has(identity)) return false;

      seenAccounts.add(identity);
      return true;
    });

    const totalBanks = accounts.length;
    const totalCurrentBalance = accounts.reduce((total, account) => {
      return total + account.currentBalance;
    }, 0);

    return parseStringify({ data: accounts, totalBanks, totalCurrentBalance });
  } catch (error) {
    console.error(
      "An error occurred while getting the accounts:",
      getPlaidErrorCode(error) ?? (error instanceof Error ? error.message : "Unknown error")
    );
    throw error;
  }
};

// Get one bank account
export const getAccount = async ({ appwriteItemId }: GetAccountProps): Promise<{
  data: Account;
  transactions: Transaction[];
}> => {
  try {
    // get bank from db
    const bank = await getBank({ documentId: appwriteItemId });

    // get account info from plaid
    let accountsResponse;
    try {
      accountsResponse = await plaidClient.accountsGet({
        access_token: bank.accessToken,
      });
    } catch (error) {
      if (isItemLoginRequired(error)) {
        throw new Error("This bank needs to be reconnected through Plaid.");
      }
      throw error;
    }
    const accountData = accountsResponse.data.accounts.find(
      (account) => account.account_id === bank.accountId
    );
    if (!accountData) {
      throw new Error(
        `Plaid account ${bank.accountId} was not found for bank record ${bank.$id}`
      );
    }

    // get transfer transactions from appwrite
    const transferTransactionsData = await getTransactionsByBankId({
      bankId: bank.$id,
    });

    const transferTransactions: Transaction[] = transferTransactionsData.documents.map(
      (transferData) => ({
        id: transferData.$id,
        name: transferData.name!,
        amount: transferData.amount!,
        date: transferData.$createdAt,
        paymentChannel: transferData.channel,
        category: transferData.category,
        type: transferData.senderBankId === bank.$id ? "debit" : "credit",
        accountId:
          transferData.senderBankId === bank.$id
            ? transferData.senderId
            : transferData.receiverId,
      })
    );

    // get institution info from plaid
    const institution = await getInstitution({
      institutionId: accountsResponse.data.item.institution_id!,
    });
    if (!institution) throw new Error("Institution not found");

    const plaidTransactions = await getTransactions({
      accessToken: bank.accessToken,
    });
    const accountTransactions = plaidTransactions.filter(
      (transaction) => transaction.accountId === bank.accountId
    );

    const account = {
      id: accountData.account_id,
      availableBalance: accountData.balances.available!,
      currentBalance: accountData.balances.current!,
      institutionId: institution.institution_id,
      name: accountData.name,
      officialName: accountData.official_name,
      mask: accountData.mask!,
      type: accountData.type as string,
      subtype: accountData.subtype! as string,
      appwriteItemId: bank.$id,
      sharableId: bank.sharableId,
    };

    // sort transactions by date such that the most recent transaction is first
    const allTransactions = [...accountTransactions, ...transferTransactions]
      .filter((transaction) => transaction.accountId === accountData.account_id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return parseStringify({
      data: account,
      transactions: allTransactions,
    });
  } catch (error) {
    console.error(
      "An error occurred while getting the account:",
      getPlaidErrorCode(error) ?? (error instanceof Error ? error.message : "Unknown error")
    );
    throw error;
  }
};

// Get bank info
export const getInstitution = async ({
  institutionId,
}: GetInstitutionProps) => {
  try {
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ["US"] as CountryCode[],
    });

    const institution = institutionResponse.data.institution;

    if (!institution) throw new Error("Institution not found");
    return parseStringify(institution);
  } catch (error) {
    console.error("An error occurred while getting the institution:", error);
    throw error;
  }
};

// Get transactions
export const getTransactions = async ({
  accessToken,
}: GetTransactionsProps): Promise<Transaction[]> => {
  let hasMore = true;
  let cursor: string | undefined;
  const transactions: Transaction[] = [];

  try {
    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        ...(cursor !== undefined ? { cursor } : {}),
      });

      const data = response.data;

      transactions.push(
        ...data.added.map((transaction) => ({
          id: transaction.transaction_id,
          name: transaction.name,
          paymentChannel: transaction.payment_channel,
          type: transaction.payment_channel,
          accountId: transaction.account_id,
          amount: transaction.amount,
          pending: transaction.pending,
          category: transaction.category ? transaction.category[0] : "",
          date: transaction.date,
          image: transaction.logo_url,
        }))
      );
      cursor = data.next_cursor;
      hasMore = data.has_more;
    }

    return parseStringify(transactions);
  } catch (error) {
    if (isItemLoginRequired(error)) {
      console.warn("Skipping transactions for a Plaid bank that requires reconnect");
      return [];
    }
    console.error(
      "An error occurred while getting the transactions:",
      getPlaidErrorCode(error) ?? (error instanceof Error ? error.message : "Unknown error")
    );
    throw error;
  }
};