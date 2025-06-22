import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Inter, Source_Code_Pro } from 'next/font/google';
import { cn } from '@/lib/utils';

const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const fontSourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
});

export const metadata: Metadata = {
  title: 'EduCentral - The Future of Learning',
  description: 'An integrated platform for students and teachers to create, learn, and grow together.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-body antialiased", fontInter.variable, fontSourceCodePro.variable)}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
