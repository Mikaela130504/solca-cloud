import { useMemo, useState } from "react";
import { validateFields } from "../utils/validators.js";

export default function useForm(initialValues, rules = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (submitted) {
      setErrors(validateFields({ ...values, [name]: type === "checkbox" ? checked : value }, rules));
    }
  };

  const validate = () => {
    const nextErrors = validateFields(values, rules);
    setErrors(nextErrors);
    setSubmitted(true);
    return Object.keys(nextErrors).length === 0;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setSubmitted(false);
  };

  return { values, errors, setValues, handleChange, validate, reset, isValid };
}
