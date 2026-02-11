import './globals.css';

export const metadata = {
  title: 'RN + Web Platform',
  description: 'Monorepo starter with API, web and mobile apps'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
