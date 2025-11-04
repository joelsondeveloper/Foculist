import { motion } from "framer-motion";
import { fieldMotion } from "@/utils/motions";

interface FormFieldProps {
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  options?: string[] | { value: string; label: string }[];
  onChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => void;
}

const FormField = ({
  label,
  placeholder = "",
  type = "text",
  value,
  options,
  onChange,
}: FormFieldProps) => {
  const isTextArea = type === "area";
  const baseClass =
    "w-full px-4 py-2 rounded-xl bg-primary-foreground/13 outline-0 focus:ring-2 focus:ring-primary/30 transition";

  return (
    <label className="flex flex-col gap-2">
      <span className="font-medium text-sm">{label}</span>

      {/* Textarea */}
      {isTextArea && (
        <motion.textarea
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`${baseClass} resize-none`}
          variants={fieldMotion}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          rows={4}
        />
      )}

      {/* Input */}
      {!isTextArea && !options && (
        <motion.input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={baseClass}
          variants={fieldMotion}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
        />
      )}

      {/* Select */}
      {options && (
        <motion.select
          value={value}
          onChange={onChange}
          className={baseClass}
          variants={fieldMotion}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
        >
          <option value="" disabled hidden>
            {placeholder || "Selecione uma opção"}
          </option>
          {options.map((option) => {
            const label = typeof option === "string" ? option : option.label;
            const value = typeof option === "string" ? option : option.value;
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </motion.select>
      )}
    </label>
  );
};

export default FormField;
