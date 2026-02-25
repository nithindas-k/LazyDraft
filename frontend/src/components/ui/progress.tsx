import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
    React.ElementRef<typeof ProgressPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
    const isIndeterminate = value === undefined || value === null;

    return (
        <ProgressPrimitive.Root
            ref={ref}
            className={cn(
                "relative h-4 w-full overflow-hidden rounded-full bg-slate-100",
                className
            )}
            {...props}
        >
            {isIndeterminate ? (
                /* Smooth looping indeterminate bar using framer-motion */
                <motion.div
                    className="absolute inset-y-0 rounded-full"
                    style={{
                        background: "linear-gradient(90deg, #4285F4, #34A853, #FBBC05, #EA4335, #4285F4)",
                        backgroundSize: "200% 100%",
                        width: "45%",
                    }}
                    animate={{
                        left: ["-45%", "100%"],
                        backgroundPosition: ["0% 0%", "100% 0%"],
                    }}
                    transition={{
                        duration: 1.4,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "loop",
                    }}
                />
            ) : (
                <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            )}
        </ProgressPrimitive.Root>
    );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
