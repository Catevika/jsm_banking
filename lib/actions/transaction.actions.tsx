"use server";

import { createAdminClient } from "@/lib/appwrite";
import { decryptId, parseStringify } from "@/lib/utils";
import { ID, Query } from "node-appwrite";

import { createTransfer } from './dwolla.actions';
import { getBank, getBankByAccountId } from './user.actions';

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_TRANSACTION_COLLECTION_ID: TRANSACTION_COLLECTION_ID,
} = process.env;

export const createTransaction = async (transaction: CreateTransactionProps) => {
  try {
    const { database } = await createAdminClient();

    const newTransaction = await database.createDocument(
      DATABASE_ID!,
      TRANSACTION_COLLECTION_ID!,
      ID.unique(),
      {
        channel: 'Online',
        category: 'Transfer',
        ...transaction
      }
    );

    return parseStringify(newTransaction);
  } catch (error) {
    console.log(error);
  }
};
export const getTransactionsByBankId = async ({ bankId }: GetTransactionsByBankIdProps) => {
  try {
    const { database } = await createAdminClient();

    const senderTransactions = await database.listDocuments(
      DATABASE_ID!,
      TRANSACTION_COLLECTION_ID!,
      [Query.equal('senderBankId', bankId)],
    );

    const receiverTransactions = await database.listDocuments(
      DATABASE_ID!,
      TRANSACTION_COLLECTION_ID!,
      [Query.equal('receiverBankId', bankId)],
    );

    const transactions = {
      total: senderTransactions.total + receiverTransactions.total,
      documents: [
        ...senderTransactions.documents,
        ...receiverTransactions.documents,
      ]
    };

    return parseStringify(transactions);
  } catch (error) {
    console.log(error);
  }
};
export const makeTransfer = async (data: { sharableId: string; senderBank: string; amount: string; name: string; email: string; }) => {

  try {
    const receiverAccountId = decryptId(data.sharableId);
    const receiverBank = await getBankByAccountId({
      accountId: receiverAccountId,
    });
    const senderBank = await getBank({ documentId: data.senderBank });

    const transferParams = {
      sourceFundingSourceUrl: senderBank.fundingSourceUrl,
      destinationFundingSourceUrl: receiverBank.fundingSourceUrl,
      amount: data.amount,
    };
    // create transfer
    const transfer = await createTransfer(transferParams);

    // create transfer transaction
    if (transfer) {
      const transaction = {
        name: data.name,
        amount: data.amount,
        senderId: senderBank.accountId,
        senderBankId: senderBank.$id,
        receiverId: receiverBank.accountId,
        receiverBankId: receiverBank.$id,
        email: data.email,
      };

      const newTransaction = await createTransaction(transaction);

      return newTransaction;
    }
  } catch (error) {
    console.log(error);
  }
};