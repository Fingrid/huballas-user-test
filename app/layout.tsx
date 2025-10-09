import './globals.css'
import TwoLevelNavigation from '../components/TwoLevelNavigation'
import { labGrotesqueWeb } from './_fonts/fonts'
import { cn } from '../lib/cn'
import { LoadingProvider } from '../lib/contexts/LoadingContext'

// Style objects for consistent styling
const styles = {
  body: 'bg-[var(--color-background-level-2)] min-h-screen',
  main: 'flex-1',
  footer: 'bg-[var(--color-dark-background-level-3)] text-white',
  footerContent: 'content-container pt-8 pb-8',
  footerGrid: 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-8 mb-8'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(`${labGrotesqueWeb.variable}`, styles.body)}>
        <div className="flex flex-col min-h-screen">
          <TwoLevelNavigation />

          <main className={styles.main}>
            <LoadingProvider>
              {children}
            </LoadingProvider>
          </main>

          <footer className={styles.footer}>
            <div className={styles.footerContent}>
              <div className={styles.footerGrid}>

              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}