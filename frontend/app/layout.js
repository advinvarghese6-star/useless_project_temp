import './globals.css';

export const metadata = {
  title: 'CODE RED — Anti-Gravity Code Editor',
  description: 'A deliberately useless, chaotic productivity enforcement tool. Stop typing and your code gets punished.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
