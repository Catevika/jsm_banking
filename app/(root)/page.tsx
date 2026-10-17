import HeaderBox from '@/components/HeaderBox';
import PlaidLink from '@/components/PlaidLink';
import RecentTransactions from '@/components/RecentTransactions';
import RightSidebar from '@/components/RightSidebar';
import TotalBalanceBox from '@/components/TotalBalanceBox';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { redirect } from 'next/navigation';

const Home = async ({ searchParams }: SearchParamProps) => {
  const { id, page } = await searchParams;

  const currentPage = Number(page as string) || 1;

  const loggedIn = await getLoggedInUser();

  if (!loggedIn) redirect('/sign-in');

  const accounts = await getAccounts({
    userId: loggedIn.userId
  });

  if (!accounts) return;
  if (accounts.data.length === 0) {
    return (
      <section className="home">
        <div className="home-content">
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={loggedIn.name || 'Guest'}
            subtext="Connect a bank account to see your balance and recent transactions."
          />
          <div className="flex flex-col items-start gap-4 rounded-xl border border-gray-200 p-6 shadow-chart">
            <h2 className="header-2">Get started with Horizon</h2>
            <p className="text-14 text-gray-600">
              Securely connect your bank account to view and manage your finances.
            </p>
            <PlaidLink user={loggedIn} variant="primary" />
          </div>
        </div>
      </section>
    );
  }

  const appwriteItemId = (id as string) || accounts.data[0]?.appwriteItemId;
  if (!appwriteItemId) return null;

  const account = await getAccount({ appwriteItemId });

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={loggedIn.name || 'Guest'}
            subtext="Access and manage your account and transactions efficiently."
          />

          <TotalBalanceBox
            accounts={accounts.data}
            totalBanks={accounts.totalBanks}
            totalCurrentBalance={accounts.totalCurrentBalance}
          />
        </header>

        <RecentTransactions
          accounts={accounts.data}
          transactions={account.transactions}
          appwriteItemId={appwriteItemId}
          page={currentPage}
        />
      </div>

      <RightSidebar
        user={loggedIn}
        transactions={account.transactions}
        banks={accounts.data?.slice(0, 2)}
      />
    </section>
  );
};

export default Home;
