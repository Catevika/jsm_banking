"use client";

import CustomInput from '@/components/CustomInput';
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { signIn, signUp } from '@/lib/actions/user.actions';
import { authFormSchema } from '@/lib/utils';
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { z } from "zod";

const AuthForm = ({ type }: { type: string; }) => {
  const router = useRouter();

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      address1: "",
      city: "",
      state: "",
      postalCode: "",
      dateOfBirth: "",
      ssn: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {

    try {
      if (type === 'sign-up') {
        const userData = {
          firstName: data.firstName!,
          lastName: data.lastName!,
          address1: data.address1!,
          city: data.city!,
          state: data.state!,
          postalCode: data.postalCode!,
          dateOfBirth: data.dateOfBirth!,
          ssn: data.ssn!,
          email: data.email,
          password: data.password
        };
        signUp(userData);
      }

      if (type === 'sign-in') {
        const userData = {
          email: data.email,
          password: data.password,
        };
        signIn(userData)
          .then(() => {
            router.refresh();
            router.push('/');
          });
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <section className='auth-form'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {type === 'sign-up' &&
            <>
              <div className='flex gap-4'>
                <CustomInput name='firstName' control={form.control} label='First Name' placeholder='Enter your first name' autoComplete='given-name' />
                <CustomInput name='lastName' control={form.control} label='Last Name' placeholder='Enter your last name' autoComplete='family-name' />
              </div>
              <CustomInput name='address1' control={form.control} label='Address' placeholder='Enter your address' autoComplete='none' />
              <CustomInput name='city' control={form.control} label='City' placeholder='Enter your city' autoComplete='none' />
              <div className='flex gap-4'>
                <CustomInput name='state' control={form.control} label='State' placeholder='Example: NY' autoComplete='none' />
                <CustomInput name='postalCode' control={form.control} label='Postal Code' placeholder='Example: 11101' autoComplete='none' />
              </div>
              <div className='flex gap-4'>
                <CustomInput name='dateOfBirth' control={form.control} label='Date of Birth' placeholder='YYYY-MM-DD' autoComplete='none' />
                <CustomInput name='ssn' control={form.control} label='SSN' placeholder='Example: 1234' autoComplete='none' />
              </div>
            </>
          }

          <CustomInput name='email' control={form.control} label='Email' placeholder='Enter your email' autoComplete='email' />

          <CustomInput name='password' control={form.control} label='Password' placeholder='Enter your password' autoComplete='current-password' />

          <div className='flex flex-col gap-4'>
            <Button className='form-btn' type="submit">
              {type === 'sign-in' ? 'Signing In' : 'Signing Up'}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
};

export default AuthForm;
