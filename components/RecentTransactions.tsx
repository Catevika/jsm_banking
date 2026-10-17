"use client";

import BankInfo from '@/components/BankInfo';
import { BankTabItem } from '@/components/BankTabItem';
import { Pagination } from '@/components/Pagination';
import TransactionsTable from '@/components/TransactionsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
import { useRouter, useSearchParams } from "next/navigation";

const RecentTransactions = ({ accounts, transactionsByAccount, appwriteItemId, page = 1 }: RecentTransactionsProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedAccountId = searchParams.get("id") ?? appwriteItemId;
  const rowsPerPage = 10;
  const accountTransactionPages = accounts.map((account) => {
    const transactions =
      transactionsByAccount.find((entry) => entry.accountId === account.id)
        ?.transactions ?? [];
    const totalPages = Math.ceil(transactions.length / rowsPerPage);
    const indexOfLastTransaction = page * rowsPerPage;
    const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;

    return {
      account,
      totalPages,
      currentTransactions: transactions.slice(
        indexOfFirstTransaction,
        indexOfLastTransaction
      ),
    };
  });

  const handleAccountChange = (accountId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", accountId);
    params.delete("page");
    router.push(`${window.location.pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  return (
    <section className='recent-transactions'>
      <header className='flex items-center justify-between'>
        <h2 className='recent-transactions-label'>Recent Transactions</h2>
        <Link className='view-all-btn' href={`/transaction-history/?id=${selectedAccountId}`}>View all</Link>
      </header>

      <Tabs
        value={selectedAccountId}
        onValueChange={handleAccountChange}
        className="w-full"
      >
        <TabsList className='recent-transactions-tablist'>
          {accounts.map((account) => (
            <TabsTrigger key={account.id} value={account.appwriteItemId} className='recent-transactions-tab'>
              <BankTabItem account={account} appwriteItemId={selectedAccountId} />
            </TabsTrigger>
          ))}
        </TabsList>
        {accountTransactionPages.map(({ account, currentTransactions, totalPages }) => (
          <TabsContent className='space-y-4' key={account.id} value={account.appwriteItemId}>
            <BankInfo account={account} appwriteItemId={selectedAccountId} type='full' />
            <h3 className='text-18 font-semibold text-gray-900'>
              Transactions for {account.name}
            </h3>
            {currentTransactions.length > 0 ? (
              <TransactionsTable transactions={currentTransactions} />
            ) : (
              <p className='text-14 text-gray-600'>
                No transactions found for this account.
              </p>
            )}
            {totalPages > 1 && (
              <div className='my-4 w-full'>
                <Pagination totalPages={totalPages} page={page} />
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
};

export default RecentTransactions;
