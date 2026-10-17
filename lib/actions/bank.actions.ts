"use server";

import {
  CountryCode
} from "plaid";

import { plaidClient } from "../plaid";
import { parseStringify } from "../utils";

import { getTransactionsByBankId } from "./transaction.actions";
import { getBank, getBanks } from "./user.actions";

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
        // get each account info from plaid
        const accountsResponse = await plaidClient.accountsGet({
          access_token: bank.accessToken,
        });
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
    const accounts = linkedAccounts.filter((account) => {
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
    console.error("An error occurred while getting the accounts:", error);
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
    const accountsResponse = await plaidClient.accountsGet({
      access_token: bank.accessToken,
    });
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
      })
    );

    // get institution info from plaid
    const institution = await getInstitution({
      institutionId: accountsResponse.data.item.institution_id!,
    });
    if (!institution) throw new Error("Institution not found");

    const transactions = await getTransactions({
      accessToken: bank.accessToken,
    });

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
    const allTransactions = [...transactions, ...transferTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return parseStringify({
      data: account,
      transactions: allTransactions,
    });
  } catch (error) {
    console.error("An error occurred while getting the account:", error);
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
  let transactions: Transaction[] = [];

  try {
    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
      });

      const data = response.data;

      transactions = response.data.added.map((transaction) => ({
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
      }));

      hasMore = data.has_more;
    }

    return parseStringify(transactions);
  } catch (error) {
    console.error("An error occurred while getting the transactions:", error);
    throw error;
  }
};