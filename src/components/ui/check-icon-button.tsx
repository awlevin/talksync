import { Check, CheckCheck, Loader2 } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CheckIconButtonStates = "checked" | "unchecked" | "loading";

const SIZE = "h-4 w-4";

interface CheckIconButtonProps extends ButtonProps {
  state: CheckIconButtonStates;
}

export function CheckIconButton({
  state,
  ...rest
}: CheckIconButtonProps) {
  let Component;
  switch (state) {
    case "unchecked":
      Component = Check;
      break;
    case "checked":
      Component = CheckCheck;
      break;
    case "loading":
      Component = Loader2;
      break;
    default:
      return null;
  }
  return (
    <Button variant="outline" size="icon" {...rest}>
      <Component className={cn(SIZE, state === "loading" && "animate-spin")} />
    </Button>
  );
}
