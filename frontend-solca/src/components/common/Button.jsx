import { classNames } from "../../utils/helpers.js";

export default function Button({ children, variant = "primary", type = "button", loading = false, className = "", ...props }) {
  return (
    <button className={classNames("btn", `btn-${variant}`, className)} type={type} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="spinner" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}
