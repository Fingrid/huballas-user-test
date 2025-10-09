import './globals.css'
import TwoLevelNavigation from '../components/TwoLevelNavigation'
import { labGrotesqueWeb } from './_fonts/fonts'
import { cn } from '../lib/cn'
import { LoadingProvider } from '../lib/contexts/LoadingContext'

// Style objects for consistent styling
const styles = {
  body: 'app-body',
  layoutContainer: 'flex flex-col min-h-screen',
  main: 'app-main',
  footer: 'app-footer',
  footerContent: cn('content-container', 'app-footer-content'),
  footerGrid: 'app-footer-grid'
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