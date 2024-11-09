"use client";

import Footer from '@/components/Footer';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { sidebarLinks } from '@/constants';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MobileNav = ({ user }: MobileNavProps) => {
  const pathname = usePathname();

  return (
    <section className='w-full max-w-[264px]'>
      <Sheet>
        <SheetTrigger>
          <Image className='cursor-pointer' src='/icons/hamburger.svg' alt='Menu' width={30} height={30} />
        </SheetTrigger>
        <SheetContent className='border-none bg-white' side='left'>
          <SheetHeader>
            <SheetTitle></SheetTitle>
            <SheetDescription></SheetDescription>
            <Link href='/' className='cursor-pointer flex items-center gap-1 px-4'>
              <Image src='/icons/logo.svg' alt='Horizon logo' width={34} height={34} priority />
              <h1 className='text-26 font-ibm-plex-serif font-bold to-black-1'>Horizon</h1>
            </Link>
            <div className='mobilenav-sheet'>
              <SheetClose asChild>
                <nav className='flex h-full flex-col gap-6 pt-16 text-white'>
                  {sidebarLinks.map((item) => {
                    const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`);

                    return (
                      <SheetClose asChild key={item.route}>
                        <Link className={cn('mobilenav-sheet_close w-full', { 'bg-bank-gradient': isActive })} href={item.route}>
                          <Image className={cn({ 'brightness-[3] invert-0': isActive })} src={item.imgURL} alt={item.label} width={20} height={20} />
                          <p className={cn('text-16 font-semibold text-black-2', { 'text-white': isActive })} >{item.label}</p>
                        </Link>
                      </SheetClose>
                    );
                  })}

                  USER
                </nav>
              </SheetClose>
              <Footer user={user} type='mobile' />
            </div>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </section>
  );
};
export default MobileNav;
