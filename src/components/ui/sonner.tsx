import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-neutral-900/90 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-[0_8px_30px_rgb(0,0,0,0.4)] group-[.toaster]:rounded-2xl group-[.toaster]:p-5",
          description: "group-[.toast]:text-gray-400 group-[.toast]:font-medium",
          actionButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-white group-[.toast]:hover:bg-white/20 group-[.toast]:border-white/5",
          cancelButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-gray-400 group-[.toast]:hover:text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
