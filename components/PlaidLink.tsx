"use client";

import { createLinkToken, exchangePublicToken } from '@/lib/actions/user.actions';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { PlaidLinkOptions, usePlaidLink, type PlaidLinkOnSuccess } from 'react-plaid-link';
import { Button } from './ui/button';

const PlaidLink = ({ user, variant }: PlaidLinkProps) => {
  const router = useRouter();
  const [token, setToken] = useState('');

  useEffect(() => {
    const getLinkToken = async () => {
      const data = await createLinkToken(user);
      setToken(data?.linkToken);
    };

    getLinkToken();
  }, [user]);


  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token: string) => {
    await exchangePublicToken({
      publicToken: public_token,
      user,
    });
    router.push('/');
  }, [user]);

  const config: PlaidLinkOptions = {
    token,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return <>
    {variant === 'primary'
      ? <Button className='plaidlink-primary' onClick={() => open()} disabled={!ready}>Connect Bank</Button>
      : variant === 'ghost'
        ? <Button>Connect Bank</Button>
        : (
          <Button>Connect Bank</Button>
        )
    }
  </>;
};
export default PlaidLink;
