import AuthFooter from '@/components/AuthFooter';
import AuthForm from '@/components/AuthForm';
import AuthHeader from '@/components/AuthHeader';
import { getLoggedInUser } from '@/lib/actions/user.actions';

const SignUp = async () => {
  const user = await getLoggedInUser();

  return (
    <section className='flex items-center justify-start h-screen flex-col w-full px-6'>
      <AuthHeader type='sign-up' />
      {user ? (
        <div className='flex flex-col gap-4'>
          {/* PLAIDLINK */}
        </div>
      ) : (
        <>
          <AuthForm type='sign-up' />
        </>
      )}
      <AuthFooter type='sign-up' />
    </section>
  );
};
export default SignUp;
