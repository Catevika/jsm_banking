"use client";

import { Button } from '@/components/ui/button';
import { createLinkToken, exchangePublicToken } from '@/lib/actions/user.actions';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { PlaidLinkOptions, usePlaidLink, type PlaidLinkOnSuccess } from 'react-plaid-link';
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
    {variant === 'primary' ? (
      <Button className='plaidlink-primary' onClick={() => open()} disabled={!ready}>Connect Bank</Button>
    ) : variant === 'ghost' ? (
      <Button className='plaidlink-ghost' onClick={() => open()} disabled={!ready} variant='ghost'>
        <Image src='/icons/connect-bank.svg' alt='Connect Bank' width={24} height={24} />
        <p className='text-[16px] font-semibold text-black-2'>Connect Bank</p>
      </Button>
    ) : (
      <Button className='plaidlink-default' onClick={() => open()} disabled={!ready}>
        <Image src='/icons/connect-bank.svg' alt='Connect Bank' width={24} height={24} />
        <p className='hidden text-[16px] font-semibold text-black-2 xl:block'>Connect Bank</p>
      </Button>
    )}
  </>;
};
export default PlaidLink;
