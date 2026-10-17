import HeaderBox from '@/components/HeaderBox';
import PaymentTransferForm from '@/components/PaymentTransferForm';
import PlaidLink from '@/components/PlaidLink';
import { getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';

const Transfer = async () => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn) return null;

  const accounts = await getAccounts({
    userId: loggedIn.userId
  });

  if (!accounts) return;

  const accountsData = accounts.data;

  if (accountsData.length === 0) {
    return (
      <section className='payment-transfer'>
        <HeaderBox
          title='Payment Transfer'
          subtext='Connect a bank account before setting up a transfer.'
        />
        <div className='flex flex-col items-start gap-4 rounded-xl border border-gray-200 p-6 shadow-chart'>
          <h2 className='header-2'>No bank accounts connected</h2>
          <p className='text-14 text-gray-600'>
            Connect a bank account to select a source for your transfer.
          </p>
          <PlaidLink user={loggedIn} variant='primary' />
        </div>
      </section>
    );
  }

  return (
    <section className='payment-transfer'>
      <HeaderBox title='Payment Transfer' subtext='Please provide any specific details or notes related to the payment transfer' />

      <section className='size-full pt-5'>
        <PaymentTransferForm accounts={accountsData} />
      </section>
    </section>
  );
};

export default Transfer;
