import './globals.css';

export const metadata = {
  title: 'FlatTracker – Track & Compare Flats',
  description: 'Track photos, location, rent and details of flats you visit, then compare them side by side.',
  icons: { icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏠</text></svg>' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <div className="max-w-lg mx-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
