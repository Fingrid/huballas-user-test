import './globals.css'
import TwoLevelNavigation from './_components/ui/TwoLevelNavigation/TwoLevelNavigation'
import { cn } from '@/lib/utils/cn'
import { LoadingProvider } from '../lib/contexts/LoadingContext'
import Footer from '@/app/_components/ui/Footer/Footer'

// Style objects for consistent styling
const styles = {
  body: 'app-body',
  layoutContainer: 'flex flex-col min-h-screen max-w-[1440px] mx-auto border-l border-r border-[var(--color-separator)]',
  header: 'app-header',
  main: 'app-main',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(styles.body)}>
        <div className={styles.layoutContainer}>
          <header className={styles.header}>
            <TwoLevelNavigation />
          </header>

          <main className={styles.main}>
            <LoadingProvider>
              {children}
            </LoadingProvider>
          </main>

          <Footer />
        </div>
      </body>
    </html>
  )
}