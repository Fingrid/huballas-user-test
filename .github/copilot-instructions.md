# Huballas User Tests - AI Coding Instructions

## Project Overview
This is a static site used for user testing the visualization of electricity market data.

## Technology Stack
- Package manager: pnpm
- Framework: Next.js
- Graphs: Echarts
- Styles: Tailwind CSS
- Data: CSV file (served as a static file)
- Hosting: GitHub Pages

## Design Guidelines
- MUST use Echarts for all graph visualizations.
- MUST use Fingrid Design System Colors defined at globals.css, MUST not change the color values of the design system.
- MUST write semantic HTML for better accessibility.
- SHOULD ensure responsive design for different screen sizes.
- SHOULD keep the user interface intuitive and user-friendly.
- SHOULD maintain a consistent color scheme throughout the application.

## Tailwind Guidelines
- MUST use Tailwind CSS for styling components.
- MUST use Tailwind CSS utility classes for styling.
- MUST follow the existing Tailwind CSS conventions used in the project.
- MUST avoid custom CSS unless absolutely necessary.
- SHOULD prefer separating styles into objects for better readability and maintainability.

## Code Guidelines
- MUST use TypeScript for all new code.
- MUST define types and interfaces for all components and functions.
- MUST use strict typing and avoid using `any` type.
- MUST follow DRY (Don't Repeat Yourself) principles.
- SHOULD separate components into smaller, reusable components where possible.
- SHOULD write clear and concise comments for complex logic.

## Git commits
If you make a clear and concise set of changes, prompt user if a commit is needed.

- MUST write clear and concise commit messages using conventional commit format.
- MUST include a brief description of the changes made in the commit message.
- SHOULD break down large changes into smaller, manageable commits.

