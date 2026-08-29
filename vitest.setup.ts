// Registers @testing-library/jest-dom matchers (toBeInTheDocument, etc.) with
// Vitest's expect. Safe to load in the node environment too — it only extends
// expect and does not touch the DOM at import time.
import '@testing-library/jest-dom/vitest'
