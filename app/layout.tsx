import './globals.css'
import TwoLevelNavigation from './_components/ui/TwoLevelNavigation'
import { labGrotesqueWeb } from './_fonts/fonts'
import { cn } from '@/lib/utils/cn'
import { LoadingProvider } from '../lib/contexts/LoadingContext'
import Footer from '@/app/_components/ui/Footer'

// Style objects for consistent styling
const styles = {
  body: 'app-body',
  layoutContainer: 'flex flex-col min-h-screen',
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
      <body className={cn(`${labGrotesqueWeb.variable}`, styles.body)}>
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