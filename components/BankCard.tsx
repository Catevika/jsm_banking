import Copy from '@/components/Copy';
import { formatAmount } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

const BankCard = ({ account, userName, showBalance }: CreditCardProps) => {
  return (
    <div className='flex flex-col'>
      <Link href={`/transaction-history/?id=${account?.appwriteItemId}`} className='bank-card'>
        <div className='bank-card_content'>
          <div>
            <h1 className='text-16 font-semibold text-white'>{account.name || userName}</h1>
            <p className='font-ibm-plex-serif font-black text-white'>{formatAmount(account.currentBalance)}</p>
          </div>
          <article className='flex flex-col gap-2'>
            <div className='flex justify-between'>
              <h1 className='text-12 font-semibold text-white'>{userName}</h1>
              <h2 className='text-12 font-semibold text-white'>●● / ●●</h2>
            </div>
            <p className='text-14 font-semibold tracking-[1.1px] text-white'>●●●● ●●●● ●●●●<span className='text-16'> {account?.mask}</span></p>
          </article>
        </div>
        <div className='bank-card_icon'>
          <Image src='/icons/Paypass.svg' alt='Pay' width={48} height={48} />
          <Image className='ml-5' src='/icons/mastercard.svg' alt='Mastercard' width={45} height={32} />
        </div>
        <Image className='absolute top-0 left-0' src='/icons/lines.png' alt='Lines' width={316} height={190} priority />
      </Link>
      {showBalance && <Copy title={account.sharableId} />}
    </div>
  );
};

export default BankCard;
