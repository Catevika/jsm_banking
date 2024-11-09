import AuthFooter from '@/components/AuthFooter';
import AuthForm from '@/components/AuthForm';
import AuthHeader from '@/components/AuthHeader';

const SignIn = async () => {
  return (
    <section className='flex-center h-screen flex-col w-full px-6'>
      <AuthHeader type='sign-in' />
      <AuthForm type='sign-in' />
      <AuthFooter type='sign-in' />
    </section>
  );
};
export default SignIn;
