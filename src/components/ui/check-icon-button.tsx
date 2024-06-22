import { Check, CheckCheck, Loader2 } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CheckIconButtonStates = "checked" | "unchecked" | "loading";

const SIZE = "h-4 w-4";

interface CheckIconButtonProps extends ButtonProps {
  state: CheckIconButtonStates;
}

export const COMPONENTS = {
  checked: CheckCheck,
  unchecked: Check,
  loading: Loader2,
}

export function CheckIconButton({
  state,
  ...rest
}: CheckIconButtonProps) {
  let Component;
  Component = COMPONENTS[state];
  return (
    <Button variant="outline" size="icon" {...rest}>
      <Component className={cn(SIZE, state === "loading" && "animate-spin")} />
    </Button>
  );
}
