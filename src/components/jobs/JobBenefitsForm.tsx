import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { WorkModel } from '@/enums/WorkModel';
import { MarkdownEditor } from '../utils/MarkdownEditor';

export const JobBenefitsForm = () => {
  const form = useFormContext();
  if (!form) {
    return null;
  }
  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="step4.workModel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Modelo de trabalho</FormLabel>
            <FormControl>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o modelo de trabalho" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {Object.entries(WorkModel).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="step4.benefits"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Benefícios</FormLabel>
            <FormControl>
              <MarkdownEditor
                value={field.value}
                onChange={(val) => field.onChange(val || "")}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};