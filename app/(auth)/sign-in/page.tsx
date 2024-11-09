import AuthFooter from '@/components/AuthFooter';
import AuthForm from '@/components/AuthForm';
import AuthHeader from '@/components/AuthHeader';
import { getLoggedInUser } from '@/lib/actions/user.actions';

const SignIn = async () => {
  const user = await getLoggedInUser();

  return (
    <section className='flex-center h-screen flex-col w-full px-6'>
      <AuthHeader type='sign-in' />
      {user ? (
        <div className='flex flex-col gap-4'>
          {/* PLAIDLINK */}
        </div>
      ) : (
        <AuthForm type='sign-in' />
      )}

      <AuthFooter type='sign-in' />
    </section>
  );
};
export default SignIn;
