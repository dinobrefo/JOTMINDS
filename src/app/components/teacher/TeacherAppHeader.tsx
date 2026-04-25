import { Menu } from 'lucide-react';
import { User } from '../../types';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

interface TeacherAppHeaderProps {
  user: User;
  onLogout: () => void;
}

export function TeacherAppHeader({ user, onLogout }: TeacherAppHeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-border px-4 flex items-center justify-between sticky top-0 z-10">
      {/* Left: Logo + Avatar */}
      <div className="flex items-center gap-3">
        {/* JotMinds Wordmark */}
        <div className="flex items-center gap-2">
          <div className="text-[18px] font-bold bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
            JotMinds
          </div>
        </div>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center text-white text-[13px] font-semibold">
          {user.name.charAt(0)}
        </div>
      </div>

      {/* Right: Menu Icon */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent>
          <div className="flex flex-col gap-4 py-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.school && (
                <p className="text-sm text-muted-foreground">{user.school}</p>
              )}
            </div>
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={onLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
