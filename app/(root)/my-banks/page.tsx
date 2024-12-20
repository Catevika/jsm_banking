import BankCard from '@/components/BankCard';
import HeaderBox from '@/components/HeaderBox';
import { getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';

const MyBanks = async () => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn && !loggedIn.$id) return;

  const accounts = await getAccounts({
    userId: loggedIn.$id
  });

  return (
    <section className='flex'>
      <div className='my-banks'>
        <HeaderBox title='My Bank accounts' subtext='Effortlessly manage your banking activities' />

        <div className='space-y-4'>
          <h2 className='header-2'>Your cards</h2>
          <div className='flex flex-wrap gap-6'>
            {accounts && accounts.data.map((account: Account) => (
              <BankCard key={account.id} userName={loggedIn.name} account={account} showBalance={true} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
export default MyBanks;
