import { getLoggedInUser } from '@/lib/actions/user.actions';
import Link from 'next/link';

const AuthFooter = async ({ type }: { type: string; }) => {
  const user = await getLoggedInUser();

  return (
    <>
      {!user ? <section className='auth-form'>
        <footer className='flex justify-center gap-1'>
          <p className='text-14 font-normal text-gray-600' >{type === 'sign-in' ? "Don't have an account?" : 'Already have an account?'}</p>
          <Link className='form-link' href={type === 'sign-in' ? '/sign-up' : '/sign-in'}>
            {type === 'sign-in' ? 'Sign Up' : 'Sign In'}
          </Link>
        </footer>
      </section> : null}
    </>
  );
};
export default AuthFooter;
