import { logoutAccount } from '@/lib/actions/user.actions';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const Footer = ({ user, type = 'desktop' }: FooterProps) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogOut = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      const result = await logoutAccount();
      if (!result.success) {
        setLogoutError(result.error ?? 'Unable to log out. Please try again.');
        return;
      }

      router.replace('/sign-in');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      setLogoutError('Unable to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {user ? (
        <div className="w-full">
          <footer className="footer">
            <div className={type === 'mobile' ? 'footer_name-mobile' : 'footer_name'}>
              <p className="text-xl font-bold text-gray-700">
                {user.name[0]}
              </p>
            </div>

            <div className={type === 'mobile' ? 'footer_email-mobile' : 'footer_email'}>
              <h1 className="text-14 truncate text-gray-700 font-semibold">
                {user?.name}
              </h1>
              <p className="text-14 truncate font-normal text-gray-600">
                {user?.email}
              </p>
            </div>

            <button
              className="footer_image"
              type="button"
              aria-label="Log out"
              aria-busy={isLoggingOut}
              disabled={isLoggingOut}
              onClick={handleLogOut}
            >
              <Image src="icons/logout.svg" fill alt="" />
            </button>
          </footer>
          {logoutError && (
            <p className="text-14 text-red-600" role="alert">
              {logoutError}
            </p>
          )}
        </div>
      ) : null}
    </>
  );
};

export default Footer;
