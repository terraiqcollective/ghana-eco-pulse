import Dashboard from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';

export const metadata = {
  title: "EcoPulse Ghana | Forest Carbon Monitoring",
  description: "National Environmental Agency geospatial platform for monitoring forest carbon stock and mining-driven carbon loss across Ghana.",
};

export default function Page() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
