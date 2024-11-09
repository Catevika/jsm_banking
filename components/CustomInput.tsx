import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authFormSchema } from '@/lib/utils';
import { type Control, type FieldPath } from 'react-hook-form';
import { z } from 'zod';

const formSchema = authFormSchema('sign-up');
interface CustomInputProps {
  control: Control<z.infer<typeof formSchema>>;
  name: FieldPath<z.infer<typeof formSchema>>;
  label: string;
  placeholder: string;
  autoComplete: string;
}
const CustomInput = ({ control, name, label, placeholder, autoComplete }: CustomInputProps) => {
  return <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem className='form-item'>
        <FormLabel className='form-label'>{label}</FormLabel>
        <div className='flex flex-col w-full'>
          <FormControl>
            <Input className='input-class' type={name === 'password' ? 'password' : 'text'} placeholder={placeholder} {...field} autoComplete={autoComplete} />
          </FormControl>
          <FormMessage className='form-message mt-2' />
        </div>
      </FormItem>
    )}
  />;
};

export default CustomInput;
