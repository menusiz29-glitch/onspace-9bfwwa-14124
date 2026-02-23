import { useState } from 'react';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { registerUstoz, loginUstoz, Ustoz } from '@/lib/auth';

interface UstozAuthProps {
  onLogin: (ustoz: Ustoz) => void;
}

export default function UstozAuth({ onLogin }: UstozAuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [yuklanyapti, setYuklanyapti] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      toast({
        title: 'Xato',
        description: 'Barcha maydonlarni to\'ldiring',
        variant: 'destructive',
      });
      return;
    }

    setYuklanyapti(true);
    try {
      const ustoz = await loginUstoz(username.trim(), password);
      toast({
        title: 'Xush kelibsiz!',
        description: `${ustoz.full_name}, tizimga muvaffaqiyatli kirdingiz`,
      });
      onLogin(ustoz);
    } catch (error: any) {
      toast({
        title: 'Xato',
        description: error.message || 'Kirish xatosi',
        variant: 'destructive',
      });
    } finally {
      setYuklanyapti(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim() || !fullName.trim()) {
      toast({
        title: 'Xato',
        description: 'Barcha maydonlarni to\'ldiring',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Xato',
        description: 'Parol kamida 6 belgidan iborat bo\'lishi kerak',
        variant: 'destructive',
      });
      return;
    }

    setYuklanyapti(true);
    try {
      await registerUstoz(username.trim(), password, fullName.trim());
      toast({
        title: 'Ro\'yxatdan o\'tdingiz!',
        description: 'Admin tasdiqlashini kuting. Tasdiqlangandan keyin kirish imkoniyati ochiladi.',
      });
      setMode('login');
      setPassword('');
      setFullName('');
    } catch (error: any) {
      toast({
        title: 'Xato',
        description: error.message || 'Ro\'yxatdan o\'tish xatosi',
        variant: 'destructive',
      });
    } finally {
      setYuklanyapti(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md shadow-xl border-2 animate-slide-up">
        <CardHeader className="space-y-1 bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(221,83%,43%)] text-white rounded-t-lg">
          <CardTitle className="text-2xl flex items-center gap-2">
            {mode === 'login' ? (
              <>
                <LogIn className="h-6 w-6" />
                Ustoz tizimiga kirish
              </>
            ) : (
              <>
                <UserPlus className="h-6 w-6" />
                Ustoz ro'yxatdan o'tish
              </>
            )}
          </CardTitle>
          <CardDescription className="text-blue-100">
            {mode === 'login'
              ? 'O\'z hisobingizga kiring'
              : 'Yangi ustoz hisobi yarating'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {mode === 'register' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                To'liq ism-familiya:
              </label>
              <Input
                placeholder="Ism Familiya"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={yuklanyapti}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Username:
            </label>
            <Input
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={yuklanyapti}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Parol:
            </label>
            <Input
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={yuklanyapti}
            />
          </div>

          <Button
            onClick={mode === 'login' ? handleLogin : handleRegister}
            disabled={yuklanyapti}
            className="w-full"
            size="lg"
          >
            {yuklanyapti ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Kutilmoqda...
              </>
            ) : mode === 'login' ? (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Kirish
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-5 w-5" />
                Ro'yxatdan o'tish
              </>
            )}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">yoki</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            disabled={yuklanyapti}
            className="w-full"
          >
            {mode === 'login'
              ? 'Ro\'yxatdan o\'tish'
              : 'Kirish sahifasiga qaytish'}
          </Button>
        </CardContent>
      </Card>

      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
