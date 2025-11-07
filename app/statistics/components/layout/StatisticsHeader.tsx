"use client";

import { useLocalization } from "@/lib/stores/localization.store";
import { cn } from "@/lib/utils/cn";
import CallToActionLink from "@/app/_components/ui/CallToActionLink/CallToActionLink";
import Breadcrumb from "@/app/_components/ui/Breadcrumb/Breadcrumb";
import type { ReactNode } from "react";
import styles from "./StatisticsHeader.module.css";

interface StatisticsHeaderProps {
  headerRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  // Optional children for sticky controls or other content
  children?: ReactNode;
  // Optional inline controls (rendered in the header gradient section)
  inlineControls?: ReactNode;
}

export default function StatisticsHeader({
  headerRef,
  className,
  children,
  inlineControls,
}: StatisticsHeaderProps) {
  const { t } = useLocalization();

  return (
    <>
      {/* Header Section */}
      <div ref={headerRef} className={cn(styles.header, className)}>
        {/* Page Title */}
        <div className={styles.titleSection}>
          <Breadcrumb currentPage={t("statistics.pageTitle")} />
          <h1 className={styles.title}>{t("statistics.pageTitle")}</h1>
        </div>

        {/* Optional Inline Controls */}
        {inlineControls && (
          <div className={styles.controlsSection}>
            {inlineControls}
          </div>
        )}
      </div>

      {/* Description Section */}
      <div className={styles.descriptionSection}>
        <p className={styles.description}>
          {t("statistics.pageDescription")}
        </p>
        <CallToActionLink href="#">
          {t("navigation.moreInfo")}
        </CallToActionLink>
      </div>

      {/* Optional Sticky Controls or other content passed as children */}
      {children}
    </>
  );
}
