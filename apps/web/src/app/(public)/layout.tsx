type PublicLayoutProps = {
  children: React.ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
