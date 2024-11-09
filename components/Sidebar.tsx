"use client";

import Footer from '@/components/Footer';
import { sidebarLinks } from '@/constants';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = ({ user }: SidebarProps) => {
  const pathname = usePathname();

  return <section className='sidebar'>
    <nav className='flex flex-col gap-4'>
      <Link href='/' className='mb-12 cursor-pointer flex items-center gap-2'>
        <Image className='size-[24px] max-xl:size-14' src='/icons/logo.svg' alt='Horizon logo' width={34} height={34} priority />
        <h1 className='sidebar-logo'>Horizon</h1>
      </Link>
      {sidebarLinks.map((item) => {
        const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`);

        return (
          <Link className={cn('sidebar-link', { 'bg-bank-gradient': isActive })} href={item.route} key={item.label}>
            <div className='relative size-6'>
              <Image className={cn({ 'brightness-[3] invert-0': isActive })} src={item.imgURL} alt={item.label} fill />
            </div>
            <p className={cn('sidebar-label', { '!text-white': isActive })} >{item.label}</p>
          </Link>
        );
      })}
      USER
    </nav>
    <Footer user={user} type='desktop' />
  </section>;
};
export default Sidebar;
