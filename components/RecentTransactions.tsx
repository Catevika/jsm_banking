import BankInfo from '@/components/BankInfo';
import { BankTabItem } from '@/components/BankTabItem';
import { Pagination } from '@/components/Pagination';
import TransactionsTable from '@/components/TransactionsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';
const RecentTransactions = ({ accounts, transactions = [], appwriteItemId, page = 1 }: RecentTransactionsProps) => {
  const rowsPerPage = 10;
  const totalPages = Math.ceil(transactions.length / rowsPerPage);
  const indexOfLastTransaction = page * rowsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);

  return (
    <section className='recent-transactions'>
      <header className='flex items-center justify-between'>
        <h2 className='recent-transactions-label'>Recent Transactions</h2>
        <Link className='view-all-btn' href={`/transaction-history/?id=${appwriteItemId}`}>View all</Link>
      </header>

      <Tabs defaultValue={appwriteItemId} className="w-full">
        <TabsList className='recent-transactions-tablist'>
          {accounts.map((account) => (
            <TabsTrigger key={account.id} value={account.appwriteItemId} className='recent-transactions-tab'>
              <BankTabItem key={account.id} account={account} appwriteItemId={appwriteItemId} />
            </TabsTrigger>
          ))}
        </TabsList>
        {accounts.map((account: Account) => (
          <TabsContent className='space-y-4' key={account.id} value={account.appwriteItemId}>
            <BankInfo account={account} appwriteItemId={appwriteItemId} type='full' />
          </TabsContent>
        ))}
      </Tabs>
      <TransactionsTable transactions={currentTransactions} />
      {totalPages > 1 && (
        <div className='my-4 w-full'>
          <Pagination totalPages={totalPages} page={page} />
        </div>)
      }
    </section>
  );
};

export default RecentTransactions;
