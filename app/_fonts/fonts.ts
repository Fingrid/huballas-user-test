import localFont from "next/font/local";

export const labGrotesqueWeb = localFont({
  variable: "--font-lab-grotesque-web",
  src: [
    {
      path: "./LabGrotesqueWeb-Bold.woff",
      style: "normal",
      weight: "bold",
    },
    {
      path: "./LabGrotesqueWeb-Regular.woff",
      weight: "400 600",
    },
    {
      path: "./LabGrotesqueWeb-Light.woff",
      style: "normal",
      weight: "100 300",
    },
    {
      path: "./LabGrotesqueWeb-BoldItalic.woff",
      style: "italic",
      weight: "bold",
    },
    {
      path: "./LabGrotesqueWeb-Italic.woff",
      weight: "400 600",
      style: "italic",
    },
    {
      path: "./LabGrotesqueWeb-LightItalic.woff",
      style: "italic",
      weight: "100 300",
    },
  ],
});
