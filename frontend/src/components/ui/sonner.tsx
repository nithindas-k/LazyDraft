import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const baseClassNames = {
    toast:
      "group toast rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-lg px-4 py-3",
    title: "text-[13px] font-semibold leading-tight",
    description: "text-[12px] text-slate-600 mt-0.5 leading-snug",
    icon: "text-slate-700",
    actionButton: "rounded-lg bg-blue-600 text-white hover:bg-blue-700",
    cancelButton: "rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200",
    success: "border-emerald-200 bg-emerald-50",
    error: "border-rose-200 bg-rose-50",
    warning: "border-amber-200 bg-amber-50",
    info: "border-blue-200 bg-blue-50",
  }

  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        ...toastOptions,
        classNames: {
          ...baseClassNames,
          ...(toastOptions?.classNames || {}),
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
