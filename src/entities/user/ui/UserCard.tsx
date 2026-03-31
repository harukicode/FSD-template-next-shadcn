import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent } from "@/shared/ui";
import type { User as UserType } from "../model/types";

interface UserCardProps {
  user: UserType;
  className?: string;
}

export function UserCard({ user, className }: UserCardProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          {user.avatar ? (
            <Image src={user.avatar} alt={user.name} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <User className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <span className="mt-1 inline-block text-xs capitalize text-muted-foreground">{user.role}</span>
        </div>
      </CardContent>
    </Card>
  );
}
