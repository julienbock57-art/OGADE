const variantClasses: Record<string, string> = {
  success: "bg-green-100 text-green-800",
  warning: "bg-orange-100 text-orange-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
  default: "bg-gray-100 text-gray-800",
};

type BadgeProps = {
  variant?: keyof typeof variantClasses;
  text: string;
};

export default function Badge({ variant = "default", text }: BadgeProps) {
  const classes = variantClasses[variant] ?? variantClasses.default;
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}
    >
      {text}
    </span>
  );
}
