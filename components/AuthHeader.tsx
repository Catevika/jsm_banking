import { getLoggedInUser } from '@/lib/actions/user.actions';
import Image from 'next/image';
import Link from 'next/link';

const AuthHeader = async ({ type }: { type: string; }) => {
  const user = await getLoggedInUser();
  return (
    <section className='auth-form'>
      <header className='flex flex-col gap-5 md:gap-8'>
        <Link href='/' className='cursor-pointer flex items-center gap-1'>
          <Image src='/icons/logo.svg' alt='Horizon logo' width={34} height={34} priority />
          <h1 className='text-26 font-ibm-plex-serif font-bold to-black-1'>Horizon</h1>
        </Link>
        <div className='flex flex-col gap-1 md:gap-3'>
          <h1 className='text-24 lg:text-36 font-semibold text-gray-900'>{user
            ? 'Link account'
            : type === 'sign-in'
              ? 'Sign in'
              : 'Sign up'}
            <p className='text-16 font-normal text-gray-600'>{user
              ? 'Link your account to get started'
              : 'Please enter your details'}</p>
          </h1>
        </div>
      </header>
    </section>
  );
};
export default AuthHeader;
