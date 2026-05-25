import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ icon: Icon, eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="pb-6 mb-2">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div className="min-w-0 max-w-2xl">
          {(eyebrow || Icon) && (
            <div className="flex items-center gap-2 mb-2">
              {Icon && <Icon className="h-3.5 w-3.5 text-primary" />}
              {eyebrow && <p className="label-eyebrow text-primary">{eyebrow}</p>}
            </div>
          )}
          <h1 className="font-display text-3xl sm:text-4xl text-foreground leading-[1.05] text-balance">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground text-sm sm:text-[15px] mt-2 text-pretty">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
