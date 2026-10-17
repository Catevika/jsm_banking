'use server';

import { createAdminClient, createSessionClient } from '@/lib/appwrite';
import { plaidClient } from '@/lib/plaid';
import { encryptId, extractCustomerIdFromUrl, parseStringify } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { AppwriteException, ID, Query, type Models } from 'node-appwrite';
import type { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from 'plaid';
import { addFundingSource, createDwollaCustomer } from './dwolla.actions';

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;

type UserDocument = Models.Document & {
  address1: string;
  city: string;
  dateOfBirth: string;
  dwollaCustomerId: string;
  dwollaCustomerUrl: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  postalCode: string;
  ssn: string;
  state: string;
  userId: string;
};

const toAppUser = (user: UserDocument): AppUser => ({
  $id: user.$id,
  email: user.email,
  userId: user.userId,
  name: user.name ?? `${user.firstName} ${user.lastName}`,
});

export const getUserInfo = async ({ userId }: GetUserInfoProps) => {
  try {
    const { database } = await createAdminClient();

    const users = await database.listDocuments<UserDocument>(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [Query.equal('userId', userId)]
    );

    const user = users.documents[0];
    return user ? parseStringify(toAppUser(user)) : null;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// export const signIn = async ({ email, password }: SignInProps) => {
//   try {
//     const { account } = await createAdminClient();

//     const session = await account.createEmailPasswordSession(email, password);

//     (await cookies()).set("appwrite-session", session.secret, {
//       path: "/",
//       httpOnly: true,
//       sameSite: "strict",
//       secure: true,
//     });

//     const user = await getUserInfo({ userId: session.userId });

//     return parseStringify(user);

//   } catch (error) {
//     console.log('Error', error);
//   }
// };

export const signIn = async ({ email, password }: SignInProps) => {
  try {
    const { account, database } = await createAdminClient();

    const session = await account.createEmailPasswordSession(email, password);

    // Get user details directly from database using session.userId
    const userDoc = await database.listDocuments<UserDocument>(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [Query.equal('userId', session.userId)]
    );

    const user = userDoc.documents[0];
    if (!user) throw new Error("User profile not found");

    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return parseStringify(toAppUser(user));

  } catch (error) {
    console.log('Error', error);
    throw error;
  }
};

export const signUp = async ({ password, ...userData }: SignUpParams) => {
  const { firstName, lastName, email } = userData;

  let newUserAccount;

  try {
    const { account, database } = await createAdminClient();

    newUserAccount = await account.create(ID.unique(), email, password, `${firstName} ${lastName}`);

    if (!newUserAccount) throw new Error('Error creating user');

    const dwollaCustomerUrl = await createDwollaCustomer({
      ...userData,
      type: 'personal',
    });

    if (!dwollaCustomerUrl) throw new Error('Error creating dwolla customer');

    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);

    const newUser = await database.createDocument<UserDocument>(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        ...userData,
        userId: newUserAccount.$id,
        dwollaCustomerId,
        dwollaCustomerUrl,
      }
    );

    const session = await account.createEmailPasswordSession(email, password);

    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return parseStringify(toAppUser(newUser));

  } catch (error) {
    console.log('Error', error);
    throw error;
  }
};

export async function getLoggedInUser() {
  const session = (await cookies()).get("appwrite-session");
  if (!session?.value) return null;

  let userId: string;
  try {
    const { account } = await createSessionClient();
    const user = await account.get();
    userId = user.$id;

  } catch (error) {
    if (error instanceof AppwriteException && error.code === 401) return null;
    console.error("Unable to get the logged-in user:", error);
    return null;
  }

  try {
    return await getUserInfo({ userId });
  } catch (error) {
    console.error("Unable to get the logged-in user profile:", error);
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const { account } = await createSessionClient();
    (await cookies()).delete("appwrite-session");
    await account.deleteSession('current');
  } catch (error) {
    console.log('Error', error);
  }
};

export const createLinkToken = async (user: AppUser) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.userId,
      },
      client_name: user.name,
      products: ['auth', 'transactions'] as Products[],
      language: 'en',
      country_codes: ['US'] as CountryCode[],
      webhook: process.env.PLAID_WEBHOOK_URL,
    };

    const response = await plaidClient.linkTokenCreate(tokenParams);

    return parseStringify({ linkToken: response.data.link_token });

  } catch (error) {
    console.log('Error', error);
    throw error;
  }
};

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  sharableId,
}: CreateBankAccountProps) => {
  try {
    const { database } = await createAdminClient();

    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        sharableId,
      }
    );

    return parseStringify(bankAccount);

  } catch (error) {
    console.log('Error', error);
    throw error;
  }
};

// This function exchanges a public token for an access token and item ID
export const exchangePublicToken = async ({
  publicToken,
  user,
}: ExchangePublicTokenProps) => {
  try {
    const { database } = await createAdminClient();

    // Get the complete user document with dwollaCustomerId
    const userDoc = await database.listDocuments<UserDocument>(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [
        Query.equal('userId', user.userId)
      ]
    );

    const fullUserData = userDoc.documents[0];
    if (!fullUserData) throw new Error("User profile not found");

    // Exchange public token for access token and item ID
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // Get account information from Plaid using the access token
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const plaidAccounts = accountsResponse.data.accounts;
    if (plaidAccounts.length === 0) {
      throw new Error("No bank accounts returned by Plaid");
    }

    const existingBanks = await database.listDocuments<Bank>(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('userId', user.userId)]
    );

    const existingPlaidAccounts = await Promise.all(
      existingBanks.documents.map(async (existingBank) => {
        const existingAccountsResponse = await plaidClient.accountsGet({
          access_token: existingBank.accessToken,
        });
        const institutionId =
          existingAccountsResponse.data.item.institution_id;
        if (!institutionId) {
          throw new Error(
            `Plaid institution not found for bank record ${existingBank.$id}`
          );
        }
        const existingAccount = existingAccountsResponse.data.accounts.find(
          (account) => account.account_id === existingBank.accountId
        );

        return existingAccount
          ? {
              institutionId,
              account: existingAccount,
              bank: existingBank,
            }
          : null;
      })
    );

    const getAccountIdentity = (
      institutionId: string,
      account: (typeof plaidAccounts)[number]
    ) =>
      account.mask
        ? JSON.stringify([
            institutionId,
            account.mask,
            account.type,
            account.subtype,
          ])
        : JSON.stringify([
            institutionId,
            account.name.trim().toLowerCase(),
            account.type,
            account.subtype,
          ]);

    const institutionId = accountsResponse.data.item.institution_id;
    if (!institutionId) {
      throw new Error("Plaid institution not found for connected bank");
    }

    const linkedAccountIdentities = new Set(
      existingPlaidAccounts
        .filter(
          (
            existing
          ): existing is NonNullable<typeof existing> => existing !== null
        )
        .map((existing) =>
          getAccountIdentity(existing.institutionId, existing.account)
        )
    );
    const bankAccounts: Models.Document[] = [];
    const unsupportedAccounts: string[] = [];
    const supportedDwollaSubtypes = new Set([
      "checking",
      "limited purpose checking",
      "savings",
      "money market",
    ]);

    for (const accountData of plaidAccounts) {
      const subtype = accountData.subtype?.trim().toLowerCase();
      if (
        accountData.type !== "depository" ||
        !subtype ||
        !supportedDwollaSubtypes.has(subtype)
      ) {
        unsupportedAccounts.push(
          `${accountData.name} (${accountData.subtype ?? accountData.type})`
        );
        continue;
      }

      const identity = getAccountIdentity(institutionId, accountData);
      if (linkedAccountIdentities.has(identity)) {
        const existing = existingPlaidAccounts.find(
          (entry) =>
            entry !== null &&
            getAccountIdentity(entry.institutionId, entry.account) === identity
        );
        if (existing) bankAccounts.push(existing.bank);
        continue;
      }

      const request: ProcessorTokenCreateRequest = {
        access_token: accessToken,
        account_id: accountData.account_id,
        processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
      };

      const processorTokenResponse =
        await plaidClient.processorTokenCreate(request);
      const fundingSourceUrl = await addFundingSource({
        dwollaCustomerId: fullUserData.dwollaCustomerId,
        processorToken: processorTokenResponse.data.processor_token,
        bankName: accountData.name,
      });

      if (!fundingSourceUrl) {
        throw Error(
          `Failed to create funding source URL for Plaid account ${accountData.account_id}`
        );
      }

      const bankAccount = await createBankAccount({
        userId: user.userId,
        bankId: itemId,
        accountId: accountData.account_id,
        accessToken,
        fundingSourceUrl,
        sharableId: encryptId(accountData.account_id),
      });
      bankAccounts.push(bankAccount);
      linkedAccountIdentities.add(identity);
    }

    // Revalidate the path to reflect the changes
    revalidatePath("/");

    // Return a success message
    return parseStringify({
      publicTokenExchange: "complete",
      bankAccount: bankAccounts[0],
      bankAccounts,
      unsupportedAccounts,
    });

  } catch (error) {
    // Log any errors that occur during the process
    console.log("Token exchange error details:", error);
    throw error;
  }
};

export const getBanks = async ({ userId }: GetBanksProps) => {
  try {
    const { database } = await createAdminClient();

    const banks = await database.listDocuments<Bank>(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('userId', userId)]
    );

    return parseStringify(banks.documents);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getBank = async ({ documentId }: GetBankProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments<Bank>(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('$id', documentId)]
    );

    const bankDocument = bank.documents[0];
    if (!bankDocument) throw new Error("Bank account not found");

    return parseStringify(bankDocument);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getBankByAccountId = async ({ accountId }: GetBankByAccountIdProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments<Bank>(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('accountId', accountId)]
    );

    if (bank.total !== 1) return null;

    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.log(error);
    throw error;
  }
};
